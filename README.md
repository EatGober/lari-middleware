# Appointments API Documentation

## Overview
This API provides endpoints for managing and retrieving appointments. All routes require authentication via the `authMiddleware`.

## Base URL
```
/api/appointments
```

## Authentication
All endpoints require a valid authentication token. The token should be included in the request headers.

## Endpoints

### Get Appointments
Retrieves a filtered list of appointments for a specific practice.

```
GET /:practiceId
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| practiceId | string | Required. The ID of the practice to retrieve appointments for |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| departmentId | string | Required* | The department ID to filter appointments by. *Required if patientId is not provided |
| patientId | string | Required* | The patient ID to filter appointments by. *Required if departmentId is not provided |
| startDate | string | No | Start date to filter appointments from (ISO date string) |
| endDate | string | No | End date to filter appointments until (ISO date string) |
| providerId | string | No | Provider ID to filter appointments by |
| maxDuration | number | No | Maximum duration in minutes for appointments |
| startTime | string | No | Start time to filter appointments from (ISO date-time string) |
| endTime | string | No | End time to filter appointments until (ISO date-time string) |

#### Response
Returns a JSON object containing the filtered and transformed appointments.

```json
{
  "appointments": [
    {
      "appointmentid": "integer",
      "patientid": "integer",
      "departmentid": "integer",
      "providerid": "integer",
      "patientPhone": "integer",
      "providerName": "string",
      "scheduledDateTimeString": "string (ISO date)",
      "duration": "integer"
    }
  ]
}
```

#### Error Responses
- `401 Unauthorized`: Invalid or missing authentication token
- `400 Bad Request`: Missing required parameters (departmentId or patientId)
- `500 Internal Server Error`: Server-side error during processing

#### Example Request
```bash
GET /api/appointments/123?departmentId=456&startDate=2025-02-05&maxDuration=60
```

#### Notes
- All date-time parameters should be provided in ISO format
- The `maxDuration` filter will return appointments with duration less than or equal to the specified value
- When both `startTime` and `endTime` are provided, appointments are filtered to fall within that time window
- Results are transformed before being returned using the `transformAppointments` utility function
