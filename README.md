

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

low-latency sub-second updates  ( 4 ms ):
so driver id 2 accepts booking he gets success message  "message": "You won the race! Navigate to pickup"   at 22:45:35.938
<img width="1920" height="1080" alt="Screenshot (399)" src="https://github.com/user-attachments/assets/e7e6996b-d814-46a2-8249-d17636e627b6" />

while competing drivers 1 and 3 get a failure message stating a competitior with id 2 has won.
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/54cb788c-cb0f-475c-8a01-4de035fe001e" />

and for passenger update will appear in real time  at  22:45:35.942
{"driverId": 2,    "message": "A driver has accepted your ride and is on the way!"}

<img width="1914" height="1080" alt="image" src="https://github.com/user-attachments/assets/1556b44f-01df-4876-b208-44dca5415c6a" />




