import re

from rest_framework import serializers

from .models import Attendance, Event, Registrant


class EventSerializer(serializers.ModelSerializer):
    attendance_count = serializers.IntegerField(read_only=True, default=0)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "name",
            "event_date",
            "registration_open",
            "attendance_count",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "registration_open",
            "attendance_count",
            "status",
            "created_at",
        ]

    def get_status(self, obj):
        return obj.bucket()

    def validate_name(self, value):
        name = " ".join(value.split())
        if len(name) < 2:
            raise serializers.ValidationError("Please enter an event name.")
        return name


class RegistrantCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registrant
        fields = [
            "full_name",
            "faculty",
            "program",
            "year_of_study",
            "student_number",
            "phone",
            "email",
            "gender",
            "experience_level",
            "heard_from",
            "code_of_conduct_agreed",
            "registration_code",
        ]
        read_only_fields = ["registration_code"]
        extra_kwargs = {
            "student_number": {"validators": []},
            "email": {"validators": []},
        }

    def validate_full_name(self, value):
        name = " ".join(value.split())
        if len(name) < 3:
            raise serializers.ValidationError("Please enter your full name.")
        return name

    def validate_student_number(self, value):
        number = value.strip().upper()
        if len(number) < 3:
            raise serializers.ValidationError("Please enter your student number.")
        return number

    def validate_phone(self, value):
        digits = re.sub(r"\D", "", value)
        if len(digits) < 9:
            raise serializers.ValidationError("Please enter a valid phone number.")
        return value.strip()

    def validate_email(self, value):
        email = value.strip().lower()
        if not email.endswith("@kab.ac.ug"):
            raise serializers.ValidationError(
                "Use your Kabale University email (@kab.ac.ug)."
            )
        return email

    def validate_code_of_conduct_agreed(self, value):
        if not value:
            raise serializers.ValidationError(
                "Please agree to the IndabaX code of conduct to register."
            )
        return value

    def create(self, validated_data):
        event = Event.open_event()
        if event is None:
            raise serializers.ValidationError(
                {
                    "detail": "Registration is closed. Check back when the next session is open."
                }
            )

        email = validated_data["email"]
        student_number = validated_data["student_number"]
        attendant = Registrant.objects.filter(email=email).first()
        returning = attendant is not None

        taken = Registrant.objects.filter(student_number__iexact=student_number)
        if attendant:
            taken = taken.exclude(pk=attendant.pk)
        if taken.exists():
            raise serializers.ValidationError(
                {
                    "student_number": "This student number is already used by another attendant."
                }
            )

        if attendant is None:
            attendant = Registrant.objects.create(**validated_data)
        else:
            if Attendance.objects.filter(attendant=attendant, event=event).exists():
                raise serializers.ValidationError(
                    {"detail": f"You are already registered for {event.name}."}
                )
            for field, value in validated_data.items():
                setattr(attendant, field, value)
            attendant.save()

        Attendance.objects.create(attendant=attendant, event=event)
        attendant._event = event
        attendant._returning = returning
        return attendant


class RegistrantListSerializer(serializers.ModelSerializer):
    faculty_label = serializers.CharField(source="get_faculty_display", read_only=True)
    year_label = serializers.CharField(source="get_year_of_study_display", read_only=True)
    experience_label = serializers.CharField(
        source="get_experience_level_display", read_only=True
    )
    attended_at = serializers.DateTimeField(read_only=True, required=False)

    class Meta:
        model = Registrant
        fields = [
            "id",
            "full_name",
            "faculty",
            "faculty_label",
            "program",
            "year_of_study",
            "year_label",
            "student_number",
            "phone",
            "email",
            "gender",
            "experience_level",
            "experience_label",
            "heard_from",
            "registration_code",
            "created_at",
            "attended_at",
        ]
