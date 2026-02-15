# Suppliers API Documentation

Base URL: `/suppliers`

## Endpoints

### 1. Register a New Supplier
Register a new supplier in the system.

- **URL:** `/suppliers`
- **Method:** `POST`
- **Content-Type:** `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `name` | string | Yes | Name of the supplier company |
| `phone` | string | Yes | Primary contact phone number |
| `contactPerson` | string | Yes | Name of the primary contact person |
| `designation` | string | No | Designation of the contact person |
| `email` | string | Yes | Official email address |
| `address` | object | Yes | Address details |
| `address.line1` | string | Yes | Address line 1 |
| `address.line2` | string | No | Address line 2 |
| `address.city` | string | No | City |
| `address.state` | string | No | State |
| `gstin` | string | No | GST Identification Number |
| `msme` | string | No | MSME registration number |
| `pan` | string | No | PAN card number |
| `dlNo` | string | No | Drug License number |
| `dlExpiryDate` | string (ISO Date) | No | Drug License expiry date (e.g., "2025-12-31") |
| `balance` | number | No | Initial balance (Default: 0) |
| `paymentTerms` | number | No | Payment terms in days (Default: 30) |
| `description` | string | No | Additional notes or description |
| `status` | string | No | "Active" or "Inactive" (Default: "Active") |

#### Sample Request Body
```json
{
  "name": "Global Pharma Solutions",
  "phone": "+91 9876543210",
  "contactPerson": "John Doe",
  "designation": "Sales Manager",
  "email": "sales@globalpharma.com",
  "address": {
    "line1": "123 Business Park",
    "city": "Mumbai",
    "state": "Maharashtra"
  },
  "gstin": "27AAAAA0000A1Z5",
  "dlNo": "DL-12345/2024",
  "dlExpiryDate": "2026-12-31T00:00:00.000Z"
}
```

#### Success Response
- **Code:** 201 Created
- **Content:**
```json
{
  "message": "Supplier registered successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Global Pharma Solutions",
    "phone": "+91 9876543210",
    "contactPerson": "John Doe",
    "designation": "Sales Manager",
    "email": "sales@globalpharma.com",
    "address": {
      "line1": "123 Business Park",
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "gstin": "27AAAAA0000A1Z5",
    "dlNo": "DL-12345/2024",
    "dlExpiryDate": "2026-12-31T00:00:00.000Z",
    "balance": 0,
    "paymentTerms": 30,
    "status": "Active",
    "isDeleted": false,
    "__v": 0
  }
}
```

---

### 2. Get All Suppliers
Retrieve a list of all active suppliers.

- **URL:** `/suppliers`
- **Method:** `GET`

#### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "message": "All suppliers were retrived successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Global Pharma Solutions",
      "purchaseCount": 5,
      "purchaseAmount": 15400.50,
      ...
    }
  ]
}
```

---

### 3. Get ID and Name of Suppliers
Retrieve simplified data (ID and Name) for all active suppliers, useful for dropdowns.

- **URL:** `/suppliers/get_id_and_name`
- **Method:** `GET`

#### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "message": "Supplier id was retrived successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Global Pharma Solutions"
  }
}
```

---

### 4. Get Specific Supplier
Retrieve details of a single supplier by ID.

- **URL:** `/suppliers/:id`
- **Method:** `GET`
- **URL Params:** `id=[string]`

#### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "message": "Supplier was retrived successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Global Pharma Solutions",
    "phone": "+91 9876543210",
    ...
  }
}
```
