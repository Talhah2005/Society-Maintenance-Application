# Society Maintenance Application

A comprehensive mobile solution for managing society maintenance bills, collections, and reporting, built with **React Native** (frontend), **Express.js + Node.js** (backend), and **MongoDB** (database).

## Functional Overview

The app streamlines maintenance billing and cash collection for residential societies, supporting three user roles:

- **Admin** (superuser, default/hardcoded account)
- **Team Members** (cash collectors for houses)
- **Users / Residents** (house owners/tenants who pay maintenance bills)

---

## 🔑 Authentication & Registration

- **Login & Signup:** Separate pages for all roles.
- **Admins:** One or two default Admin accounts, hardcoded in backend.
- **Team Members:** Added by Admin via portal; must verify email before access.
- **Users (Residents):** Register with detailed info and must verify email before accessing their account.

**User Registration Fields:**
- Name, Email (with verification), Password & Confirm Password
- House Number / Address
- Contact Number
- Car Registration Number(s) (multiple)
- Motorcycle Registration Number(s) (multiple)

After signup, users receive a verification email. Only verified users can log in.

---

## 🏠 Residents (User Role)

After logging in, residents can:
- View monthly maintenance bill and status (Paid / Unpaid)
- Access payment history (per month/year)
- Use "Forget Password" (OTP via email, then reset)
- Receive WhatsApp confirmation messages when payments are marked as paid

**WhatsApp Message Example:**  
`Hi [Name], your bill for [Month] has been paid on [Date], [Time].`

---

## 👥 Team Members (Collector Role)

Team Members see:
- List of houses assigned
- For each house: Resident’s Name, Contact, Bill Amount, Payment Status, "Paid" button

On marking payment:
- Confirmation popup
- Updates payment status in database
- WhatsApp message sent to resident
- Payment recorded in Admin’s dashboard

---

## 🛠 Admin Role (Super Admin)

Admins have full control:
### Team Management
- Add/Edit/Delete/View Team Members (name, email, phone)
- Email verification for new members

### User Management
- View all residents with full details
- Car/Motorcycle registration numbers
- Payment histories
- Approve/verify accounts (after email verification)

### Dues Management
- Track pending & collected amounts
- Dues summary: total pending/collected (amount + users count)
- Monthly fee setting (e.g., PKR 3,000)
- List of users with pending/paid dues

### Yearly Reports
- Click any month for user payment details (amount, date, time)
- Click "Total Collected" to see contributing users

### UI/UX & Styling Fixes
- Remove black shadow from the red header bar
- Add proper padding in forms
- Remove unnecessary backend connection logs from frontend UI
- Style dues section with cards, clean typography, color codes (Red = Pending, Green = Collected)
- Improve Add Team Member form styling
- Clean up Yearly Report styling

---

## ✅ Final App Flow

- Signup/Login → Email Verification → Access
- Admin is pre-created
- Users & Team Members must verify emails for access
- Residents: View/pay bills, get WhatsApp confirmations, track history
- Team: Collect dues, mark payments, send WhatsApp confirmations
- Admin: Full portal for users, teams, payments, dues summary, reports

---

## 🛠 Tech Stack

- **Frontend:** React Native
- **Backend:** Express.js + Node.js
- **Database:** MongoDB

---

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Talhah2005/Society-Maintenance-Application.git
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the backend**
   ```bash
   npm start
   ```
4. **Run the React Native frontend** (see frontend README for details)

---

## License

No license specified.

## Contributing

Open to contributions via Issues or Pull Requests.

## Contact

Maintained by [Talhah2005](https://github.com/Talhah2005).
