from django.core.management.base import BaseCommand
from datetime import date

from inversiones.models import Inversion, Precio


class Command(BaseCommand):
    help = "Calcula las cantidades iniciales"

    def handle(self, *args, **kwargs):

        fecha_inicial = date(2022, 2, 15)

        self.stdout.write("Calculando cantidades...")

        inversiones = Inversion.objects.all()

        for inversion in inversiones:

            precio = Precio.objects.get(
                activo=inversion.activo,
                fecha=fecha_inicial
            )

            cantidad = (
                inversion.weight_inicial *
                inversion.portafolio.valor_inicial
            ) / precio.precio

            inversion.cantidad = cantidad
            inversion.save()

        self.stdout.write(
            self.style.SUCCESS("Cantidades calculadas correctamente")
        )