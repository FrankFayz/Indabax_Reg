from django.urls import path

from . import views

urlpatterns = [
    path("choices/", views.ChoicesView.as_view(), name="choices"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("registrants/", views.RegistrantListView.as_view(), name="registrants"),
    path("registrants/stats/", views.StatsView.as_view(), name="stats"),
    path("registrants/export/", views.ExportCSVView.as_view(), name="export"),
]
