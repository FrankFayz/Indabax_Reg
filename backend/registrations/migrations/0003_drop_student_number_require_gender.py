from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("registrations", "0002_events_and_attendance"),
    ]

    operations = [
        migrations.AlterField(
            model_name="registrant",
            name="student_number",
            field=models.CharField(blank=True, max_length=40, null=True, unique=True),
        ),
    ]
