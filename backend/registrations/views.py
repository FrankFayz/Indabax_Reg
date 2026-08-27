import csv
from io import StringIO

from django.contrib.auth import authenticate
from django.core.paginator import Paginator
from django.db.models import Count, Max, Q
from django.http import Http404, HttpResponse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .constants import (
    EXPERIENCE_CHOICES,
    FACULTY_CHOICES,
    GENDER_CHOICES,
    HEARD_FROM_CHOICES,
    YEAR_CHOICES,
)
from .models import Attendance, Event, Registrant
from .serializers import (
    EventSerializer,
    RegistrantCreateSerializer,
    RegistrantListSerializer,
)

PAGE_SIZE = 25
PROGRAM_SLICE_LIMIT = 7

PROFILE_CSV_HEADERS = [
    "Full name",
    "Email",
    "Student number",
    "Registration code",
    "Faculty",
    "Program",
    "Year of study",
    "Phone",
    "Gender",
    "ML/AI experience",
    "Heard from",
]


def _choice_list(choices):
    return [{"value": value, "label": label} for value, label in choices]


def _count_rows(queryset, field, labels=None):
    rows = []
    for row in queryset.values(field).annotate(count=Count("id")).order_by("-count"):
        value = row[field] or ""
        if labels:
            label = labels.get(value) or "Not shared"
        else:
            label = value.strip() or "Not shared"
        rows.append({"key": value or "unspecified", "label": label, "count": row["count"]})
    return rows


def _cap_slices(rows, limit):
    if len(rows) <= limit:
        return rows
    head = rows[:limit]
    rest = sum(item["count"] for item in rows[limit:])
    return head + [{"key": "other", "label": "Other", "count": rest}]


def _event_from_query(request):
    raw = request.query_params.get("event", "").strip()
    if not raw:
        return None
    try:
        return Event.objects.get(pk=int(raw))
    except (Event.DoesNotExist, ValueError, TypeError) as exc:
        raise Http404("Event not found.") from exc


def _scoped_registrants(request):
    event = _event_from_query(request)
    query = request.query_params.get("q", "").strip()
    faculty = request.query_params.get("faculty", "").strip()
    registrants = Registrant.objects.all()
    if event:
        registrants = registrants.filter(attendances__event=event)
    if query:
        registrants = registrants.filter(
            Q(full_name__icontains=query)
            | Q(student_number__icontains=query)
            | Q(registration_code__icontains=query)
            | Q(program__icontains=query)
            | Q(email__icontains=query)
        )
    if faculty:
        registrants = registrants.filter(faculty=faculty)
    return registrants, event


def _list_registrants(request):
    registrants, event = _scoped_registrants(request)
    if event:
        registrants = registrants.annotate(
            attended_at=Max(
                "attendances__created_at",
                filter=Q(attendances__event=event),
            )
        ).order_by("-attended_at", "-id")
    return registrants, event


def _profile_csv_row(person):
    return [
        person.full_name,
        person.email,
        person.student_number,
        person.registration_code,
        person.get_faculty_display(),
        person.program,
        person.get_year_of_study_display(),
        person.phone,
        person.get_gender_display() if person.gender else "",
        person.get_experience_level_display() if person.experience_level else "",
        person.get_heard_from_display() if person.heard_from else "",
    ]


def _csv_response(filename, header, rows):
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(header)
    writer.writerows(rows)
    response = HttpResponse(buffer.getvalue(), content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def _event_column_labels(events):
    seen = {}
    labels = []
    for event in events:
        base = event.column_label()
        count = seen.get(base, 0) + 1
        seen[base] = count
        labels.append(base if count == 1 else f"{base} ({count})")
    return labels


class ChoicesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        event = Event.open_event()
        return Response(
            {
                "faculties": _choice_list(FACULTY_CHOICES),
                "years": _choice_list(YEAR_CHOICES),
                "genders": _choice_list(GENDER_CHOICES),
                "experience": _choice_list(EXPERIENCE_CHOICES),
                "heard_from": _choice_list(HEARD_FROM_CHOICES),
                "open_event": (
                    {
                        "id": event.id,
                        "name": event.name,
                        "event_date": event.event_date.isoformat(),
                    }
                    if event
                    else None
                ),
            }
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrantCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        registrant = serializer.save()
        event = getattr(registrant, "_event", None)
        return Response(
            {
                "full_name": registrant.full_name,
                "registration_code": registrant.registration_code,
                "faculty": registrant.get_faculty_display(),
                "program": registrant.program,
                "event_name": event.name if event else "",
                "event_date": event.event_date.isoformat() if event else "",
                "returning": bool(getattr(registrant, "_returning", False)),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")
        user = authenticate(username=username, password=password)
        if user is None or not user.is_active:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "username": user.username})


class EventListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = Event.objects.annotate(attendance_count=Count("attendances"))
        return Response({"results": EventSerializer(events, many=True).data})

    def post(self, request):
        serializer = EventSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        event = serializer.save()
        event.attendance_count = 0
        return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Event.objects.annotate(attendance_count=Count("attendances")).get(
                pk=pk
            )
        except Event.DoesNotExist as exc:
            raise Http404("Event not found.") from exc

    def patch(self, request, pk):
        event = self._get(pk)
        serializer = EventSerializer(event, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        event = serializer.save()
        event.attendance_count = event.attendances.count()
        return Response(EventSerializer(event).data)

    def delete(self, request, pk):
        event = self._get(pk)
        if event.attendance_count:
            return Response(
                {
                    "detail": "This event already has attendance. Close it instead of deleting."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventOpenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist as exc:
            raise Http404("Event not found.") from exc
        event.open_registration()
        event.attendance_count = event.attendances.count()
        return Response(EventSerializer(event).data)


class EventCloseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist as exc:
            raise Http404("Event not found.") from exc
        event.close_registration()
        event.attendance_count = event.attendances.count()
        return Response(EventSerializer(event).data)


class EventExportCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist as exc:
            raise Http404("Event not found.") from exc
        rows = []
        attendances = (
            Attendance.objects.filter(event=event)
            .select_related("attendant")
            .order_by("attendant__full_name", "attendant__email")
        )
        for record in attendances:
            rows.append(
                _profile_csv_row(record.attendant)
                + [record.created_at.isoformat(), "attended"]
            )
        return _csv_response(
            f"{event.filename_stem()}.csv",
            PROFILE_CSV_HEADERS + ["Registered at", "Attendance"],
            rows,
        )


class RegistrantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        registrants, _event = _list_registrants(request)
        paginator = Paginator(registrants, PAGE_SIZE)
        page_obj = paginator.get_page(request.query_params.get("page", 1))
        serializer = RegistrantListSerializer(page_obj.object_list, many=True)
        return Response(
            {
                "count": paginator.count,
                "page": page_obj.number,
                "page_size": PAGE_SIZE,
                "total_pages": paginator.num_pages,
                "results": serializer.data,
            }
        )


class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        registrants, _event = _scoped_registrants(request)
        total = registrants.count()
        by_faculty = _count_rows(registrants, "faculty", dict(FACULTY_CHOICES))
        by_year = _count_rows(registrants, "year_of_study", dict(YEAR_CHOICES))
        by_program = _cap_slices(
            _count_rows(registrants, "program"),
            PROGRAM_SLICE_LIMIT,
        )
        by_experience = _count_rows(
            registrants, "experience_level", dict(EXPERIENCE_CHOICES)
        )
        return Response(
            {
                "total": total,
                "by_faculty": by_faculty,
                "by_year": by_year,
                "by_program": by_program,
                "by_experience": by_experience,
            }
        )


class ExportCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = list(Event.objects.order_by("event_date", "id"))
        labels = _event_column_labels(events)
        people = (
            Registrant.objects.prefetch_related("attendances")
            .all()
            .order_by("full_name", "email")
        )
        rows = []
        for person in people:
            attended_ids = {row.event_id for row in person.attendances.all()}
            marks = [
                "attended" if event.id in attended_ids else "" for event in events
            ]
            rows.append(
                _profile_csv_row(person)
                + [person.created_at.isoformat()]
                + marks
            )
        return _csv_response(
            "indabax-kabale-attendance.csv",
            PROFILE_CSV_HEADERS + ["First registered"] + labels,
            rows,
        )
