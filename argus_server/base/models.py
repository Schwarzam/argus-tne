from django.db import models
from django.conf import settings

# Create your models here.

class Telescope(models.Model):
    name = models.CharField(max_length=16, primary_key=True)
    status = models.CharField(max_length=16, default = "idle")
    ra = models.FloatField(null = True)
    dec = models.FloatField(null = True)
    alt = models.FloatField(null = True)
    az = models.FloatField(null = True)
    operation = models.TextField(null = True)
    executing_plan_id = models.BigIntegerField(null = True)
    
class Reservation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null = True)

class ObservationPlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=100, null=True)
    ra = models.FloatField()
    dec = models.FloatField()
    filters = models.CharField(max_length=40)
    framemode = models.CharField(max_length=40)
    exptime = models.IntegerField()
    start_time = models.DateTimeField()
    executed = models.BooleanField(default=False)
    executed_at = models.DateTimeField(null = True)
    outputs = models.TextField(null = True)