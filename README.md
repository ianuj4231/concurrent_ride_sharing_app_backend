

concurrency scenario 1:
when 2 nearby passengers attempt create booking at same passenger, 2 nearby customers dont get same driver

passenger 5 books..2 drivers are mapped to passenger id 5
<img width="1920" height="1080" alt="Screenshot (410)" src="https://github.com/user-attachments/assets/18840c6c-86b8-404b-aa97-a8a75d54c09a" />

since they are mapped to passenger id 5, passenger id 4 will  not have same drivers for few seconds/mins, hence the array is empty coz lock has been acquired on driver_id. 
<img width="1920" height="1080" alt="Screenshot (411)" src="https://github.com/user-attachments/assets/e1181062-efe4-4eb6-9f60-6ebec84dbbb7" />






concurrency scenario 2:
when 2 notified drivers try to click confirm booking button for same passenger:
lock has been acquired on common resource - booking_id.
<img width="1694" height="964" alt="image" src="https://github.com/user-attachments/assets/9dbc9f90-8034-47bd-ab1d-0f5f35efdb85" />

/////

low-latency sub-second updates:
<img width="1920" height="1080" alt="Screenshot (408)" src="https://github.com/user-attachments/assets/6b672ddf-9cd2-4eaf-94cb-6b5b091ede60" />



