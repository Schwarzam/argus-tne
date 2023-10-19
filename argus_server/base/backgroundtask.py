import threading
import time
import os

from base.auxiliares import files_in_directory
from base.executeobs import get_orchestrate_filename
from base.models import Telescope

from django.conf import settings


"""
TODO: Copy this to the docs 
possible staus telescope

[
    "starting observation",
    "executing operations",
    "error - orchestrate not watching",
    "error",
    "idle",
    "busy",
]
"""

def check_telescope_register():
    tel = Telescope.objects.filter(name=settings.DB_NAME).first()
    if tel:
        tel.delete()
        tel = Telescope(name=settings.DB_NAME, ra=-0, dec=0, alt=0, az=0, status='IDLE')
        tel.save()
        
def reset_telescope_register(telescope):
    telescope.ra = 0
    telescope.dec = 0
    telescope.alt = 0
    telescope.az = 0
    telescope.status = "idle"
    telescope.operation = None
    telescope.executing_plan_id = None
    telescope.save()


def check_telescope():
    file_track_dict = {}
    N = 10
    previous_files = set()  # Store files from the previous iteration
    current_iteration = 0
    handshake_count = 0

    print('Starting background task')
    taxa_atualizacao = 5
    check_telescope_register()
    while True:
        # Your database update logic here
        telescope = Telescope.objects.get(name=settings.DB_NAME)
        
        # Get the list of files in the directory
        fs_orchestrate_folder = files_in_directory(settings.ORCHESTRATE_FOLDER)
        for file in fs_orchestrate_folder:
            if file.startswith('.'):
                try: os.remove(os.path.join(settings.ORCHESTRATE_FOLDER, file))
                except: pass
                fs_orchestrate_folder.remove(file)
        
        # Detect files that disappeared before N iterations
        for file in previous_files:
            if file not in fs_orchestrate_folder:
                iterations_present = current_iteration - file_track_dict[file]['first_appearance']
                if iterations_present <= N:
                    ## extract plan_id from file name
                    plan_id = int(file.split('.')[0])
                    telescope.executing_plan_id = plan_id
                    telescope.status = "executing operations"
                    telescope.save()
                    
                # Remove file from tracking
                del file_track_dict[file]
        
        # Update file appearance and counts
        for file in fs_orchestrate_folder:
            if file not in file_track_dict:
                file_track_dict[file] = {'first_appearance': current_iteration, 'count': 1}
            else:
                file_track_dict[file]['count'] += 1
            
            if file_track_dict[file]['count'] >= N and file != 'HANDSHAKE':
                # File has been present for more than {N} iterations!
                telescope.status = "error - orchestrate not watching"
                telescope.save()
            
        # Reset the count of files no longer present in the directory
        for file in list(file_track_dict.keys()):
            if file not in fs_orchestrate_folder:
                del file_track_dict[file]

        # Check HANDSHAKE file condition
        if len(fs_orchestrate_folder) == 1 and 'HANDSHAKE' in fs_orchestrate_folder:
            handshake_count += 1
            if handshake_count >= N:
                #Only the HANDSHAKE file has been present for more than {N} iterations!
                if "error" in telescope.status:
                    reset_telescope_register(telescope)
        else:
            handshake_count = 0  # Reset handshake count if other files are present or HANDSHAKE is absent
        previous_files = fs_orchestrate_folder

        # Reset the count of files no longer present in the directory
        for file in list(file_track_dict.keys()):
            if file not in fs_orchestrate_folder:
                del file_track_dict[file]

        
        done = False
        ### If file found in DONE folder, update as done:
        if telescope.status == "executing operations":
            
            orc_name, _ = get_orchestrate_filename(telescope.executing_plan_id)
            
            done_folder = os.path.join(settings.ORCHESTRATE_DONE_FOLDER, "done")
            
            fs_done_folder = files_in_directory(done_folder)
            done = True
            
        ### If file found in ERROR folder, update as error:
        if telescope.status == "executing operations" and done == False:
            
            get_orchestrate_filename(telescope.executing_plan_id)
            
            done_folder = os.path.join(settings.ORCHESTRATE_DONE_FOLDER, "done")
            fs_done_folder = files_in_directory(done_folder)
        
        

        time.sleep(1)  # Sleep for 1 second before the next update
        
# Start the background thread when Django starts
thread = threading.Thread(target=check_telescope)
thread.daemon = True  # This makes sure the thread will exit when the main program exits
thread.start()