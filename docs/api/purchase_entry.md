# Purchase Entry API Documentation

Base URL: `/purchase_entry`

## Endpoints

### 1. Create a Purchase Entry
Create a new purchase entry for a supplier.

- **URL:** `/purchase_entry`
- **Method:** `POST`
- **Content-Type:** `application/json`

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `supplier` | string (ObjectId) | Yes | Reference ID of the supplier |
| `invoiceNumber` | string | Yes | Invoice number |
| `invoiceDate` | string (ISO Date) | Yes | Date on the invoice |
| `gstEnabled` | boolean | No | Whether GST is enabled (Default: true) |
| `tscEnabled` | boolean | No | Whether TSC is enabled (Default: true) |
| `items` | array | Yes | List of items in the purchase entry |
| `items[].item` | string (ObjectId) | Yes | Reference ID of the item |
| `items[].batch` | string | Yes | Batch number |
| `items[].quantity` | number | Yes | Quantity purchased |
| `items[].pack` | number | Yes | Pack size |
| `items[].unitPrice` | number | Yes | Price per unit |
| `items[].expiryDate` | string (ISO Date) | Yes | Item expiry date |
| `items[].purchasePrice` | number | Yes | Cost price per unit/pack |
| `items[].gst` | number | Yes | GST percentage |
| `items[].discount` | number | Yes | Discount percentage |
| `items[].free` | number | Yes | Free units/bonus |
| `subTotal` | number | Yes | Sum of purchase prices |
| `discount` | number | Yes | Total discount amount |
| `gst` | number | Yes | Total GST amount |
| `transportCharge` | number | Yes | Shipping or transport fees |
| `total` | number | Yes | Final payable amount |
| `description` | string | No | Optional notes |

#### Sample Request Body
```json
{
  "supplier": "64f1a2b3c4d5e6f7a8b9c0d1",
  "invoiceNumber": "INV-2024-001",
  "invoiceDate": "2024-02-08T10:00:00.000Z",
  "gstEnabled": true,
  "items": [
    {
      "item": "64f2b3c4d5e6f7a8b9c0d1a2",
      "batch": "BT-789",
      "quantity": 100,
      "pack": 10,
      "unitPrice": 12.5,
      "expiryDate": "2026-12-31T00:00:00.000Z",
      "purchasePrice": 1250,
      "gst": 12,
      "discount": 5,
      "free": 0
    }
  ],
  "subTotal": 1250,
  "discount": 62.5,
  "gst": 150,
  "transportCharge": 50,
  "total": 1387.5
}
```

#### Success Response
- **Code:** 201 Created
- **Content:**
```json
{
  "message": "Purchase Entry Created Successfully",
  "data": {
    "_id": "67a770389339e80313838183",
    "supplier": "64f1a2b3c4d5e6f7a8b9c0d1",
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-02-08T10:00:00.000Z",
    "items": [...],
    "subTotal": 1250,
    "discount": 62.5,
    "gst": 150,
    "transportCharge": 50,
    "total": 1387.5,
    "paymentStatus": "Pending",
    "createdAt": "2026-02-08T15:01:00.000Z",
    "updatedAt": "2026-02-08T15:01:00.000Z"
  }
}
```

---

### 2. Get Purchase Entries by Supplier
Retrieve all purchase entries associated with a specific supplier.

- **URL:** `/purchase_entry/supplier/:id`
- **Method:** `GET`
- **URL Params:** `id=[string]`

#### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "message": "Purchase Entry Found Successfully",
  "data": [...]
}
```

---

### 3. Get Specific Purchase Entry
Retrieve details of a single purchase entry by its ID.

- **URL:** `/purchase_entry/:id`
- **Method:** `GET`
- **URL Params:** `id=[string]`

#### Success Response
- **Code:** 200 OK
- **Content:**
```json
{
  "message": "Purchase Entry Found Successfully",
  "data": {
    "_id": "67a770389339e80313838183",
    "invoiceNumber": "INV-2024-001",
    ...
  }
}
```
