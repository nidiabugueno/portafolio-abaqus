from rest_framework import serializers
from .models import Inversion


class InversionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Inversion

        fields = [
            "id",
            "portafolio",
            "activo",
            "weight_inicial",
            "cantidad",
        ]