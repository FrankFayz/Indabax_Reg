from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Registrant


class RegistrationApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {
            "full_name": "Aisha Ninsiima",
            "faculty": "computing",
            "program": "BSc Computer Science",
            "year_of_study": "year_2",
            "student_number": "2023/A/1234",
            "phone": "0772123456",
            "email": "aisha@kab.ac.ug",
            "gender": "female",
            "experience_level": "beginner",
            "heard_from": "friend",
            "code_of_conduct_agreed": True,
        }

    def test_register_creates_code(self):
        response = self.client.post("/api/register/", self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["registration_code"], "INDABA-KAB-0001")
        self.assertEqual(Registrant.objects.count(), 1)

    def test_duplicate_student_number(self):
        self.client.post("/api/register/", self.payload, format="json")
        again = self.client.post("/api/register/", self.payload, format="json")
        self.assertEqual(again.status_code, 400)
        self.assertIn("already registered", again.data["student_number"][0])

    def test_organizer_list_and_export(self):
        self.client.post("/api/register/", self.payload, format="json")
        user = User.objects.create_user("organizer", "x@y.com", "test-pass-123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        listed = self.client.get("/api/registrants/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.data), 1)

        stats = self.client.get("/api/registrants/stats/")
        self.assertEqual(stats.data["total"], 1)

        export = self.client.get("/api/registrants/export/")
        self.assertEqual(export.status_code, 200)
        self.assertIn("INDABA-KAB-0001", export.content.decode())

    def test_rejects_non_kab_email(self):
        payload = {**self.payload, "email": "aisha@gmail.com", "student_number": "2023/A/9999"}
        response = self.client.post("/api/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("kab.ac.ug", response.data["email"][0].lower())
