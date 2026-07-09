from django.core.management.base import BaseCommand
import pandas as pd

from inversiones.models import Activo, Portafolio, Inversion, Precio


class Command(BaseCommand):
    help = "Carga los datos desde el archivo Excel"

    def handle(self, *args, **kwargs):

        archivo = "datos.xlsx"

        # =====================
        # Leer hojas del Excel
        # =====================

        weights = pd.read_excel(archivo, sheet_name="weights")
        precios = pd.read_excel(archivo, sheet_name="Precios")

        # =====================
        # Cargar Activos
        # =====================

        self.stdout.write("Guardando activos...")

        for nombre in weights["activos"]:
            Activo.objects.get_or_create(
                nombre=nombre
            )

        self.stdout.write(
            self.style.SUCCESS("Activos cargados correctamente")
        )

        # =====================
        # Cargar Portafolios
        # =====================

        self.stdout.write("Guardando portafolios...")

        portafolio1, _ = Portafolio.objects.get_or_create(
            nombre="Portafolio 1",
            defaults={
                "valor_inicial": 1000000000
            }
        )

        portafolio2, _ = Portafolio.objects.get_or_create(
            nombre="Portafolio 2",
            defaults={
                "valor_inicial": 1000000000
            }
        )

        self.stdout.write(
            self.style.SUCCESS("Portafolios cargados correctamente")
        )

        # =====================
        # Cargar Inversiones
        # =====================

        self.stdout.write("Guardando inversiones...")

        for _, fila in weights.iterrows():

            activo = Activo.objects.get(
                nombre=fila["activos"]
            )

            Inversion.objects.get_or_create(
                portafolio=portafolio1,
                activo=activo,
                defaults={
                    "weight_inicial": fila["portafolio 1"]
                }
            )

            Inversion.objects.get_or_create(
                portafolio=portafolio2,
                activo=activo,
                defaults={
                    "weight_inicial": fila["portafolio 2"]
                }
            )

        self.stdout.write(
            self.style.SUCCESS("Inversiones cargadas correctamente")
        )

        # =====================
        # Cargar Precios
        # =====================

        self.stdout.write("Guardando precios...")

        for _, fila in precios.iterrows():

            fecha = fila["Dates"]

            for nombre_activo in precios.columns[1:]:

                activo = Activo.objects.get(
                    nombre=nombre_activo
                )

                Precio.objects.get_or_create(
                    activo=activo,
                    fecha=fecha,
                    defaults={
                        "precio": fila[nombre_activo]
                    }
                )

        self.stdout.write(
            self.style.SUCCESS("Precios cargados correctamente")
        )