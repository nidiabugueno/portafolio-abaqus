from django.urls import path
from . import views

urlpatterns = [

    path(
        "inversiones/",
        views.inversiones,
        name="inversiones"
    ),

    path(
        "portafolio/",
        views.portafolio,
        name="portafolio"
    ),

    path(
        "dashboard/",
        views.dashboard,
        name="dashboard"
    ),

]