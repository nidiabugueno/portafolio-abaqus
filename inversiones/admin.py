from django.contrib import admin

from .models import Activo, Portafolio, Precio, Inversion

admin.site.register(Activo)
admin.site.register(Portafolio)
admin.site.register(Precio)
admin.site.register(Inversion)