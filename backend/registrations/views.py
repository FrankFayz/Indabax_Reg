import csv

from django.contrib.auth import authenticate
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.http import HttpResponse
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
from .models import Registrant
from .serializers import RegistrantCreateSerializer, RegistrantListSerializer

PAGE_SIZE = 25


def _choice_list(choices):
    return [{"value": value, "label": label} for value, label in choices]


class ChoicesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "faculties": _choice_list(FACULTY_CHOICES),
                "years": _choice_list(YEAR_CHOICES),
                "genders": _choice_list(GENDER_CHOICES),
                "experience": _choice_list(EXPERIENCE_CHOICES),
                "heard_from": _choice_list(HEARD_FROM_CHOICES),
            }
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistrantCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        registrant = serializer.save()
        return Response(
            {
                "full_name": registrant.full_name,
                "registration_code": registrant.registration_code,
                "faculty": registrant.get_faculty_display(),
                "program": registrant.program,
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


class RegistrantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        faculty = request.query_params.get("faculty", "").strip()
        registrants = Registrant.objects.all()
        if query:
            registrants = registrants.filter(
                Q(full_name__icontains=query)
                | Q(student_number__icontains=query)
                | Q(registration_code__icontains=query)
                | Q(program__icontains=query)
            )
        if faculty:
            registrants = registrants.filter(faculty=faculty)

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
        total = Registrant.objects.count()
        faculty_map = dict(FACULTY_CHOICES)
        year_map = dict(YEAR_CHOICES)
        experience_map = dict(EXPERIENCE_CHOICES)

        by_faculty = [
            {
                "key": row["faculty"],
                "label": faculty_map.get(row["faculty"], row["faculty"]),
                "count": row["count"],
            }
            for row in Registrant.objects.values("faculty")
            .annotate(count=Count("id"))
            .order_by("-count")
        ]
        by_year = [
            {
                "key": row["year_of_study"],
                "label": year_map.get(row["year_of_study"], row["year_of_study"]),
                "count": row["count"],
            }
            for row in Registrant.objects.values("year_of_study")
            .annotate(count=Count("id"))
            .order_by("-count")
        ]
        by_experience = [
            {
                "key": row["experience_level"] or "unspecified",
                "label": experience_map.get(row["experience_level"], "Not shared"),
                "count": row["count"],
            }
            for row in Registrant.objects.values("experience_level")
            .annotate(count=Count("id"))
            .order_by("-count")
        ]
        return Response(
            {
                "total": total,
                "by_faculty": by_faculty,
                "by_year": by_year,
                "by_experience": by_experience,
            }
        )


class ExportCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = (
            'attachment; filename="indabax-kabale-registrants.csv"'
        )
        writer = csv.writer(response)
        writer.writerow(
            [
                "Registration code",
                "Full name",
                "Student number",
                "Faculty",
                "Program",
                "Year of study",
                "Phone",
                "Email",
                "Gender",
                "ML/AI experience",
                "Heard from",
                "Registered at",
            ]
        )
        for person in Registrant.objects.all():
            writer.writerow(
                [
                    person.registration_code,
                    person.full_name,
                    person.student_number,
                    person.get_faculty_display(),
                    person.program,
                    person.get_year_of_study_display(),
                    person.phone,
                    person.email,
                    person.get_gender_display() if person.gender else "",
                    person.get_experience_level_display()
                    if person.experience_level
                    else "",
                    person.get_heard_from_display() if person.heard_from else "",
                    person.created_at.isoformat(),
                ]
            )
        return response
