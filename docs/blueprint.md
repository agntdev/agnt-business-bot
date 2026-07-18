# Business Workflow Assistant — Bot specification

**Archetype:** workflow

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A multi-tenant Telegram bot for small businesses to manage customer requests, bookings, and staff notifications. Businesses configure settings, customers submit requests via quick menus, and staff receive actionable notifications with status tracking. Optional paid plans enable payment collection and email summaries.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- small business owners
- local service providers
- business staff
- end customers

## Success criteria

- Businesses can onboard and configure settings via Telegram
- Customers can submit requests/bookings via buttons
- Staff receive actionable notifications with accept/decline options
- Paid plans enable seamless payment collection

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open main menu with business onboarding or customer options
- **Request service** (button, actor: customer, callback: request:service) — Initiate service request flow
  - inputs: service type, preferred time
  - outputs: confirmation message, business notification
- **Book time** (button, actor: customer, callback: booking:start) — Initiate booking flow with date/time selection
  - inputs: date, time, service details
  - outputs: confirmation, staff assignment
- **Place order** (button, actor: customer, callback: order:start) — Initiate order placement flow
  - inputs: item, quantity, delivery info
  - outputs: order confirmation, payment prompt

## Flows

### Business onboarding
_Trigger:_ /start

1. Collect business name
2. Set working hours
3. Configure notification targets
4. Invite staff

_Data touched:_ Business

### Customer request submission
_Trigger:_ button:Request service

1. Show service options
2. Collect date/time
3. Capture contact info
4. Send business notification

_Data touched:_ Request

### Staff notification handling
_Trigger:_ new request assignment

1. Send notification with buttons
2. Track staff actions (accept/decline)
3. Update request status

_Data touched:_ Request, Staff

### Payment processing
_Trigger:_ order requires payment

1. Show payment prompt
2. Verify payment status
3. Confirm request completion

_Data touched:_ Payment, Request

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Business** _(retention: persistent)_ — Business account with settings and plan type
  - fields: name, Telegram owner, timezone, working hours, notification targets, plan type
- **Staff** _(retention: persistent)_ — Business staff members with access rights
  - fields: name, Telegram ID, role, notification preferences
- **Customer** _(retention: persistent)_ — End users interacting with the business
  - fields: Telegram ID, name, conversation history, contact info
- **Request** _(retention: persistent)_ — Customer requests/bookings/orders
  - fields: ID, business, customer, type, details, status, assigned staff, datetime
- **Payment** _(retention: persistent)_ — Transaction records for paid plans/bookings
  - fields: ID, business, amount, status

## Integrations

- **Telegram** (required) — Primary messaging and notification channel
- **Email** (optional) — Optional daily summaries and receipts
- **Payment Processor** (optional) — Handle one-off charges for paid plans
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure business settings
- Invite/remove staff
- Manage request statuses
- Upgrade/downgrade plan

## Notifications

- New request alerts to business owner/staff group
- Assignment notifications to specific staff
- Daily summary at business day end
- Payment confirmation alerts

## Permissions & privacy

- Telegram-based authentication for businesses
- Minimal customer data storage (ID, name, optional contact)
- Request history retention unless deleted
- Payment data stored only if paid plan enabled

## Edge cases

- Failed payment retries
- Missing staff assignments
- Outside business hours requests
- Expired booking slots

## Required tests

- End-to-end customer request submission flow
- Staff notification and status update flow
- Payment processing with success/failure scenarios
- Daily summary delivery verification

## Assumptions

- Businesses use Telegram as primary interface
- Simple status model sufficient for workflows
- Payments off by default for free plans
- Button-based UI minimizes customer typing
