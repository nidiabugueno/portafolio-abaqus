from django.db import models


class Activo(models.Model):
    # Guarda el nombre de cada activo (EEUU, Europa, Japón, etc.)
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class Portafolio(models.Model):
    # Portafolio 1 o Portafolio 2
    nombre = models.CharField(max_length=100, unique=True)

    # Valor inicial del portafolio
    valor_inicial = models.DecimalField(max_digits=15, decimal_places=2)

    def __str__(self):
        return self.nombre


class Precio(models.Model):
    # Precio de un activo para una fecha determinada
    activo = models.ForeignKey(Activo, on_delete=models.CASCADE)
    fecha = models.DateField()
    precio = models.DecimalField(max_digits=15, decimal_places=4)

    def __str__(self):
        return f"{self.activo} - {self.fecha}"


class Inversion(models.Model):
    # Activo que pertenece a un portafolio
    portafolio = models.ForeignKey(Portafolio, on_delete=models.CASCADE)
    activo = models.ForeignKey(Activo, on_delete=models.CASCADE)

    # Weight obtenido desde el Excel
    weight_inicial = models.DecimalField(max_digits=5, decimal_places=3)

    # Cantidad calculada a partir del weight y el valor inicial
    cantidad = models.DecimalField(
        max_digits=20,
        decimal_places=6,
        default=0
    )

    def __str__(self):
        return f"{self.portafolio} - {self.activo}"