import threading
import time
from .models import Telescope

from django.conf import settings


def check_telescope_register():
    tel = Telescope.objects.filter(name=settings.DB_NAME).first()
    if tel is None:
        tel = Telescope(name=settings.DB_NAME, ra=0, dec=0, alt=0, az=0, status='idle')
        tel.save()

def check_telescope():
    print('Starting background task')
    check_telescope_register()
    while True:
        # Your database update logic here
        instance = Telescope.objects.get(name=settings.DB_NAME)  # Example: get object with pk=1
        instance.ra += 1  # Modify some field
        instance.save()

        time.sleep(10)  # Sleep for 10 seconds before the next update

# Start the background thread when Django starts
thread = threading.Thread(target=check_telescope)
thread.daemon = True  # This makes sure the thread will exit when the main program exits
thread.start()