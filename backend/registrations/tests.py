from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient, APITestCase

from .models import Attendance, Event, Registrant


class RegistrationApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {
            "full_name": "Aisha Ninsiima",
            "faculty": "computing",
            "program": "BSc Computer Science",
            "year_of_study": "year_2",
            "phone": "0772123456",
            "email": "aisha@kab.ac.ug",
            "gender": "female",
            "experience_level": "beginner",
            "heard_from": "friend",
            "code_of_conduct_agreed": True,
        }
        self.event = Event.objects.create(
            name="Weekly session",
            event_date="2026-09-04",
            registration_open=True,
        )

    def _auth(self):
        user = User.objects.create_user("organizer", "x@y.com", "test-pass-123")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        return user

    def test_register_creates_code(self):
        response = self.client.post("/api/register/", self.payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["registration_code"], "INDABA-KAB-0001")
        self.assertEqual(response.data["event_name"], "Weekly session")
        self.assertEqual(Registrant.objects.count(), 1)
        self.assertEqual(Attendance.objects.count(), 1)

    def test_register_without_code_of_conduct(self):
        payload = {**self.payload, "code_of_conduct_agreed": False}
        response = self.client.post("/api/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("code_of_conduct_agreed", response.data)
        self.assertEqual(Registrant.objects.count(), 0)

    def test_closed_registration_is_rejected(self):
        self.event.close_registration()
        response = self.client.post("/api/register/", self.payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("closed", str(response.data).lower())
        self.assertEqual(Registrant.objects.count(), 0)

    def test_same_event_same_email_is_rejected(self):
        self.client.post("/api/register/", self.payload, format="json")
        again = self.client.post("/api/register/", self.payload, format="json")
        self.assertEqual(again.status_code, 400)
        self.assertIn("already registered", str(again.data).lower())
        self.assertEqual(Registrant.objects.count(), 1)
        self.assertEqual(Attendance.objects.count(), 1)

    def test_same_email_can_register_for_next_event(self):
        self.client.post("/api/register/", self.payload, format="json")
        self.event.close_registration()
        next_event = Event.objects.create(
            name="Workshop",
            event_date="2026-09-11",
        )
        next_event.open_registration()
        self.event.refresh_from_db()
        self.assertFalse(self.event.registration_open)

        again = self.client.post(
            "/api/register/",
            {**self.payload, "full_name": "Aisha N.", "phone": "0772000000"},
            format="json",
        )
        self.assertEqual(again.status_code, 201)
        self.assertTrue(again.data["returning"])
        self.assertEqual(Registrant.objects.count(), 1)
        self.assertEqual(Attendance.objects.count(), 2)
        person = Registrant.objects.get(email="aisha@kab.ac.ug")
        self.assertEqual(person.full_name, "Aisha N.")
        self.assertEqual(person.phone, "0772000000")

    def test_gender_is_required(self):
        payload = {**self.payload, "gender": ""}
        response = self.client.post("/api/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("gender", response.data)

    def test_choices_include_open_event(self):
        response = self.client.get("/api/choices/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["open_event"]["name"], "Weekly session")
        self.event.close_registration()
        closed = self.client.get("/api/choices/")
        self.assertIsNone(closed.data["open_event"])

    def test_organizer_list_and_master_export(self):
        self.client.post("/api/register/", self.payload, format="json")
        self._auth()

        listed = self.client.get("/api/registrants/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(listed.data["count"], 1)
        self.assertEqual(len(listed.data["results"]), 1)
        self.assertEqual(listed.data["page"], 1)
        self.assertEqual(listed.data["page_size"], 25)

        stats = self.client.get("/api/registrants/stats/")
        self.assertEqual(stats.data["total"], 1)
        self.assertEqual(stats.data["by_program"][0]["label"], "BSc Computer Science")
        self.assertEqual(stats.data["by_year"][0]["key"], "year_2")
        self.assertEqual(stats.data["by_faculty"][0]["key"], "computing")
        self.assertEqual(stats.data["by_gender"][0]["key"], "female")
        self.assertEqual(stats.data["by_gender"][0]["count"], 1)

        export = self.client.get("/api/registrants/export/")
        self.assertEqual(export.status_code, 200)
        body = export.content.decode()
        self.assertIn("aisha@kab.ac.ug", body)
        self.assertIn("Weekly session 04-Sep-2026", body)
        self.assertIn("attended", body)

    def test_event_export_and_master_pivot(self):
        self.client.post("/api/register/", self.payload, format="json")
        self.event.close_registration()
        workshop = Event.objects.create(name="Workshop", event_date="2026-09-11")
        workshop.open_registration()
        self.client.post(
            "/api/register/",
            {
                **self.payload,
                "full_name": "John Doe",
                "email": "john@kab.ac.ug",
                "gender": "male",
            },
            format="json",
        )
        self._auth()

        week = self.client.get(f"/api/events/{self.event.id}/export/")
        week_body = week.content.decode()
        self.assertIn("aisha@kab.ac.ug", week_body)
        self.assertNotIn("john@kab.ac.ug", week_body)

        master = self.client.get("/api/registrants/export/").content.decode()
        aisha_row = [
            line for line in master.splitlines() if "aisha@kab.ac.ug" in line
        ][0]
        john_row = [line for line in master.splitlines() if "john@kab.ac.ug" in line][0]
        self.assertIn("Weekly session 04-Sep-2026", master)
        self.assertIn("Workshop 11-Sep-2026", master)
        self.assertEqual(aisha_row.count("attended"), 1)
        self.assertEqual(john_row.count("attended"), 1)

        scoped = self.client.get(f"/api/registrants/?event={self.event.id}")
        self.assertEqual(scoped.data["count"], 1)
        self.assertEqual(scoped.data["results"][0]["email"], "aisha@kab.ac.ug")

        event_stats = self.client.get(
            f"/api/registrants/stats/?event={workshop.id}"
        )
        self.assertEqual(event_stats.data["total"], 1)
        self.assertEqual(event_stats.data["by_gender"][0]["key"], "male")
        self.assertEqual(event_stats.data["by_gender"][0]["count"], 1)

        week_stats = self.client.get(
            f"/api/registrants/stats/?event={self.event.id}"
        )
        self.assertEqual(week_stats.data["total"], 1)
        self.assertEqual(week_stats.data["by_gender"][0]["key"], "female")

    def test_opening_an_event_closes_the_other(self):
        self._auth()
        other = Event.objects.create(name="Hack night", event_date="2026-09-18")
        opened = self.client.post(f"/api/events/{other.id}/open/")
        self.assertEqual(opened.status_code, 200)
        self.assertTrue(opened.data["registration_open"])
        self.event.refresh_from_db()
        other.refresh_from_db()
        self.assertFalse(self.event.registration_open)
        self.assertTrue(other.registration_open)
        self.assertEqual(opened.data["status"], "active")

    def test_cannot_open_a_past_event(self):
        self._auth()
        past = Event.objects.create(name="Old workshop", event_date="2026-08-01")
        opened = self.client.post(f"/api/events/{past.id}/open/")
        self.assertEqual(opened.status_code, 400)
        past.refresh_from_db()
        self.assertFalse(past.registration_open)

        listed = self.client.get("/api/events/")
        statuses = {row["name"]: row["status"] for row in listed.data["results"]}
        self.assertEqual(statuses["Old workshop"], "past")
        self.assertEqual(statuses["Weekly session"], "active")

    def test_expired_open_event_moves_to_past(self):
        leftover = Event.objects.create(
            name="Yesterday",
            event_date="2026-08-01",
            registration_open=True,
        )
        self.event.close_registration()
        choices = self.client.get("/api/choices/")
        self.assertIsNone(choices.data["open_event"])
        leftover.refresh_from_db()
        self.assertFalse(leftover.registration_open)
        self.assertEqual(leftover.bucket(), "past")

    def test_create_event_and_delete_with_attendance(self):
        self._auth()
        created = self.client.post(
            "/api/events/",
            {"name": "Office hours", "event_date": "2026-09-25"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        pk = created.data["id"]
        deleted = self.client.delete(f"/api/events/{pk}/")
        self.assertEqual(deleted.status_code, 204)

        self.client.post("/api/register/", self.payload, format="json")
        second = Event.objects.create(name="Workshop", event_date="2026-09-11")
        second.open_registration()
        self.client.post(
            "/api/register/",
            {
                **self.payload,
                "full_name": "John Doe",
                "email": "john@kab.ac.ug",
                "gender": "male",
            },
            format="json",
        )
        self.client.post("/api/register/", self.payload, format="json")

        wiped = self.client.delete(f"/api/events/{self.event.id}/")
        self.assertEqual(wiped.status_code, 204)
        self.assertFalse(Event.objects.filter(pk=self.event.id).exists())
        self.assertEqual(Attendance.objects.filter(event=second).count(), 2)
        self.assertTrue(Registrant.objects.filter(email="aisha@kab.ac.ug").exists())
        self.assertTrue(Registrant.objects.filter(email="john@kab.ac.ug").exists())

        only_john_event = Event.objects.create(name="Solo", event_date="2026-09-18")
        only_john_event.open_registration()
        self.client.post(
            "/api/register/",
            {
                **self.payload,
                "full_name": "Mary Okello",
                "email": "mary@kab.ac.ug",
            },
            format="json",
        )
        self.client.delete(f"/api/events/{only_john_event.id}/")
        self.assertFalse(Registrant.objects.filter(email="mary@kab.ac.ug").exists())

    def test_registrant_list_paginates(self):
        for index in range(26):
            self.client.post(
                "/api/register/",
                {
                    **self.payload,
                    "full_name": f"Student {index}",
                    "email": f"student{index}@kab.ac.ug",
                },
                format="json",
            )
        self._auth()

        page_one = self.client.get("/api/registrants/?page=1")
        self.assertEqual(page_one.data["count"], 26)
        self.assertEqual(page_one.data["total_pages"], 2)
        self.assertEqual(len(page_one.data["results"]), 25)

        page_two = self.client.get("/api/registrants/?page=2")
        self.assertEqual(len(page_two.data["results"]), 1)

    def test_rejects_non_kab_email(self):
        payload = {
            **self.payload,
            "email": "aisha@gmail.com",
        }
        response = self.client.post("/api/register/", payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("kab.ac.ug", response.data["email"][0].lower())
