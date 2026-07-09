from datetime import datetime

from rest_framework.response import Response
from rest_framework.decorators import api_view

from .models import Inversion, Precio, Portafolio
from .serializers import InversionSerializer

from django.shortcuts import render


@api_view(["GET"])
def inversiones(request):

    datos = Inversion.objects.all()

    serializer = InversionSerializer(
        datos,
        many=True
    )

    return Response(serializer.data)


@api_view(["GET"])
def portafolio(request):

    portafolio_id = request.GET.get("portafolio")
    fecha_inicio = request.GET.get("fecha_inicio")
    fecha_fin = request.GET.get("fecha_fin")

    if not portafolio_id or not fecha_inicio or not fecha_fin:
        return Response({
            "error": "Debe ingresar portafolio, fecha_inicio y fecha_fin"
        })

    fecha_inicio = datetime.strptime(
        fecha_inicio,
        "%Y-%m-%d"
    ).date()

    fecha_fin = datetime.strptime(
        fecha_fin,
        "%Y-%m-%d"
    ).date()

    portafolio = Portafolio.objects.get(
        id=portafolio_id
    )

    inversiones = Inversion.objects.filter(
        portafolio=portafolio
    )

    fechas = Precio.objects.filter(
        fecha__range=[fecha_inicio, fecha_fin]
    ).values_list(
        "fecha",
        flat=True
    ).distinct().order_by("fecha")

    resultado = []

    for fecha in fechas:

        valor_portafolio = 0
        activos = []

        # ===========================
        # Calcular valor de cada activo
        # ===========================

        for inversion in inversiones:

            precio = Precio.objects.get(
                activo=inversion.activo,
                fecha=fecha
            )

            valor_activo = precio.precio * inversion.cantidad

            valor_portafolio += valor_activo

            activos.append({
                "activo": inversion.activo.nombre,
                "valor": valor_activo
            })

        # ===========================
        # Calcular weights
        # ===========================

        weights = []

        for activo in activos:

            weight = activo["valor"] / valor_portafolio

            weights.append({
                "activo": activo["activo"],
                "weight": round(weight, 6)
            })

        resultado.append({

            "fecha": fecha,

            "valor_portafolio": round(
                valor_portafolio,
                2
            ),

            "weights": weights

        })

    return Response(resultado)


def dashboard(request):
    return render(request, "dashboard.html")