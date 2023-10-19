from django.contrib import admin
from .models import Telescope, ObservationPlan

# Register your models here.
admin.site.register(Telescope)
admin.site.register(ObservationPlan)