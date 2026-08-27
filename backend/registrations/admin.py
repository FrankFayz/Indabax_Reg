from django.contrib import admin

from .models import Registrant


@admin.register(Registrant)
class RegistrantAdmin(admin.ModelAdmin):
    list_display = (
        "registration_code",
        "full_name",
        "student_number",
        "faculty",
        "program",
        "year_of_study",
        "created_at",
    )
    search_fields = ("full_name", "student_number", "registration_code", "program")
    list_filter = ("faculty", "year_of_study", "experience_level")
    readonly_fields = ("registration_code", "created_at")
