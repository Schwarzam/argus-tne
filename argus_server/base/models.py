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

class Queue(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    plan = models.ForeignKey(
        'ObservationPlan',
        on_delete=models.CASCADE,
    )

class ObservationsMade(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=100, null=True)
    ra = models.FloatField()
    dec = models.FloatField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null = True)
    instructions = models.TextField(null = True)

class ObservationSchedule(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    
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
    start_time = models.DateTimeField()