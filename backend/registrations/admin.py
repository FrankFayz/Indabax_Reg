from django.contrib import admin

from .models import Attendance, Event, Registrant


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "event_date", "registration_open", "created_at")
    list_filter = ("registration_open",)
    search_fields = ("name",)


@admin.register(Registrant)
class RegistrantAdmin(admin.ModelAdmin):
    list_display = (
        "registration_code",
        "full_name",
        "email",
        "faculty",
        "program",
        "year_of_study",
        "created_at",
    )
    search_fields = ("full_name", "email", "registration_code", "program")
    list_filter = ("faculty", "year_of_study", "gender", "experience_level")
    readonly_fields = ("registration_code", "created_at")


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ("attendant", "event", "created_at")
    list_filter = ("event",)
    search_fields = ("attendant__full_name", "attendant__email", "event__name")
