import re

from django.db import models, transaction

from .constants import (
    EXPERIENCE_CHOICES,
    FACULTY_CHOICES,
    GENDER_CHOICES,
    HEARD_FROM_CHOICES,
    YEAR_CHOICES,
)


class Event(models.Model):
    name = models.CharField(max_length=150)
    event_date = models.DateField()
    registration_open = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-event_date", "-id"]

    def __str__(self):
        return f"{self.name} ({self.event_date})"

    def column_label(self):
        return f"{self.name} {self.event_date.strftime('%d-%b-%Y')}"

    def filename_stem(self):
        slug = re.sub(r"[^a-z0-9]+", "-", self.name.lower()).strip("-") or "event"
        return f"indabax-kabale-{slug}-{self.event_date.isoformat()}"

    @classmethod
    def open_event(cls):
        return cls.objects.filter(registration_open=True).first()

    def open_registration(self):
        with transaction.atomic():
            type(self).objects.select_for_update().filter(registration_open=True).update(
                registration_open=False
            )
            self.registration_open = True
            self.save(update_fields=["registration_open"])

    def close_registration(self):
        if self.registration_open:
            self.registration_open = False
            self.save(update_fields=["registration_open"])


class Registrant(models.Model):
    full_name = models.CharField(max_length=150)
    faculty = models.CharField(max_length=40, choices=FACULTY_CHOICES)
    program = models.CharField(max_length=150)
    year_of_study = models.CharField(max_length=20, choices=YEAR_CHOICES)
    student_number = models.CharField(max_length=40, unique=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    gender = models.CharField(max_length=20, choices=GENDER_CHOICES, blank=True)
    experience_level = models.CharField(
        max_length=20, choices=EXPERIENCE_CHOICES, blank=True
    )
    heard_from = models.CharField(max_length=20, choices=HEARD_FROM_CHOICES, blank=True)
    code_of_conduct_agreed = models.BooleanField()
    registration_code = models.CharField(max_length=32, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.registration_code} — {self.full_name}"

    def save(self, *args, **kwargs):
        self.student_number = self.student_number.strip().upper()
        self.email = self.email.strip().lower()
        super().save(*args, **kwargs)
        if not self.registration_code:
            self.registration_code = f"INDABA-KAB-{self.pk:04d}"
            super().save(update_fields=["registration_code"])


class Attendance(models.Model):
    attendant = models.ForeignKey(
        Registrant, related_name="attendances", on_delete=models.CASCADE
    )
    event = models.ForeignKey(
        Event, related_name="attendances", on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["attendant", "event"],
                name="unique_attendance_per_event",
            )
        ]

    def __str__(self):
        return f"{self.attendant.email} @ {self.event}"
