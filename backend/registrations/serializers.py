import re

from rest_framework import serializers

from .models import Registrant


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
        existing = Registrant.objects.filter(student_number__iexact=number).first()
        if existing:
            raise serializers.ValidationError(
                f"You are already registered. Your code is {existing.registration_code}."
            )
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


class RegistrantListSerializer(serializers.ModelSerializer):
    faculty_label = serializers.CharField(source="get_faculty_display", read_only=True)
    year_label = serializers.CharField(source="get_year_of_study_display", read_only=True)
    experience_label = serializers.CharField(
        source="get_experience_level_display", read_only=True
    )

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
        ]
