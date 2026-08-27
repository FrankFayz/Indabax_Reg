from django.urls import path

from . import views

urlpatterns = [
    path("choices/", views.ChoicesView.as_view(), name="choices"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("events/", views.EventListView.as_view(), name="events"),
    path("events/<int:pk>/", views.EventDetailView.as_view(), name="event-detail"),
    path("events/<int:pk>/open/", views.EventOpenView.as_view(), name="event-open"),
    path("events/<int:pk>/close/", views.EventCloseView.as_view(), name="event-close"),
    path(
        "events/<int:pk>/export/",
        views.EventExportCSVView.as_view(),
        name="event-export",
    ),
    path("registrants/", views.RegistrantListView.as_view(), name="registrants"),
    path("registrants/stats/", views.StatsView.as_view(), name="stats"),
    path("registrants/export/", views.ExportCSVView.as_view(), name="export"),
]
