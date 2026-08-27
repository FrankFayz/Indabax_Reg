from django.db import models

from .constants import (
    EXPERIENCE_CHOICES,
    FACULTY_CHOICES,
    GENDER_CHOICES,
    HEARD_FROM_CHOICES,
    YEAR_CHOICES,
)


class Registrant(models.Model):
    full_name = models.CharField(max_length=150)
    faculty = models.CharField(max_length=40, choices=FACULTY_CHOICES)
    program = models.CharField(max_length=150)
    year_of_study = models.CharField(max_length=20, choices=YEAR_CHOICES)
    student_number = models.CharField(max_length=40, unique=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
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
        super().save(*args, **kwargs)
        if not self.registration_code:
            self.registration_code = f"INDABA-KAB-{self.pk:04d}"
            super().save(update_fields=["registration_code"])
