# Spec Delta

## Purpose

Defines when a card number is acceptable for a given barcode type, so that stored cards always produce a scannable barcode.

## ADDED Requirements

### Requirement: Numeric barcode types require digits, length and check digit
For `EAN_13` (13 digits), `EAN_8` (8 digits) and `UPC_A` (12 digits), the card number SHALL consist of exactly that many digits and its last digit SHALL be the correct GS1 check digit.

#### Scenario: Valid EAN-13
- **WHEN** a card has barcode type `EAN_13` and number `4006381333931`
- **THEN** validation passes

#### Scenario: Wrong check digit
- **WHEN** a card has barcode type `EAN_13` and number `4006381333932`
- **THEN** the request is rejected with 400 and `errors` names `cardNumber`

#### Scenario: Wrong length
- **WHEN** a card has barcode type `EAN_8` and a 9-digit number
- **THEN** the request is rejected with 400 and `errors` names `cardNumber`

#### Scenario: Non-digit characters
- **WHEN** a card has barcode type `UPC_A` and a number containing letters
- **THEN** the request is rejected with 400 and `errors` names `cardNumber`

#### Scenario: Valid EAN-8 and UPC-A
- **WHEN** a card has barcode type `EAN_8` with number `96385074`, or `UPC_A` with number `036000291452`
- **THEN** validation passes

### Requirement: Free-form barcode types accept any non-blank text
For `CODE_128` and `QR_CODE`, the card number SHALL be accepted when it is not blank and within the maximum length.

#### Scenario: Alphanumeric Code 128
- **WHEN** a card has barcode type `CODE_128` and number `AB-1234`
- **THEN** validation passes

#### Scenario: Blank number
- **WHEN** a card has any barcode type and a blank number
- **THEN** the request is rejected with 400 and `errors` names `cardNumber`

### Requirement: Number validation does not hide other errors
When `barcodeType` itself is missing or unknown, the API SHALL report that field and SHALL NOT fail with a server error while checking the number.

#### Scenario: Missing barcode type
- **WHEN** a client posts a card without `barcodeType`
- **THEN** the response is 400 and `errors` names `barcodeType`

#### Scenario: Unknown barcode type
- **WHEN** a client posts a `barcodeType` that is not one of the supported values
- **THEN** the response is 400 as a problem response
