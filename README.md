# Stellar Tip Bot

> A complete end-to-end decentralized tipping application built on the Stellar network (Soroban), featuring advanced smart contract architecture, inter-contract communication, event streaming, automated CI/CD infrastructure, and a mobile-responsive frontend.

## Project Overview & Quick Links

* Live Demo Link: [https://stellar-tip-bot-production.up.railway.app/](https://stellar-tip-bot-production.up.railway.app/)
* Demo Video Link (1-2 minutes): [https://github.com/banzaan/stellar-tip-bot/blob/main/assets/document_5980801530876402962.mp4]
* Public GitHub Repository: [https://github.com/banzaan/stellar-tip-bot](https://github.com/banzaan/stellar-tip-bot)
* Primary Tech Stack: JavaScript (83.3%), Rust (14.9%), CSS (1.8%), Stellar Soroban SDK.

### Smart Contract Deployments (Stellar Testnet)

* Registry Contract ID: CBJV7U6RZW7VWUVP5CMNYXOVY3H45ZYHEP6VAQYWQKI5JSBBTDO4EMLE
* Processor Contract ID: CBBFTWDF4IVELBU6TH6UFGBZXNIDMGACBJBTD7IV4556JI225RICO6HK
* Sample Transaction Hashes:
* dac45c931dd42a584d0f888f571ac1838b3a56020d0c62a6ef161f268b0d8735
* 2edc83d1080daf23f5e7424e7486d80faf127b9c5d75da8519e8fe93f59ca038
* 00322fe101b95a55d66d94177c7b789fcbe058224988b72cda84d935a00be1c0



## Submission Checklist & Requirements Status

* [x] Public GitHub repository
* [x] README with complete documentation
* [x] Minimum 10+ meaningful commits
* [x] Live demo link (Hosted on Railway)
* [x] Contract deployment address (Registry & Processor provided)
* [x] Transaction hash for contract interaction (Provided)
* [x] Screenshot showing:
* [x] Mobile responsive UI
* [x] CI/CD pipeline running (GitHub Actions)
* [x] Test output with 3+ passing tests
* [ ] Demo video link (1-2 minutes)

## Advanced Technical Architecture & Implementation

### 1. Advanced Smart Contract Development

The project utilizes a modular dual-contract structure built with Rust and the Soroban SDK:

* Registry Contract (CBJV7U6RZW7VWUVP5CMNYXOVY3H45ZYHEP6VAQYWQKI5JSBBTDO4EMLE): Manages user profiles, metadata registries, and state management mapping for tipping recipients.
* Processor Contract (CBBFTWDF4IVELBU6TH6UFGBZXNIDMGACBJBTD7IV4556JI225RICO6HK): Handles core tipping execution, secure asset handling, and payment processing rules.

### 2. Inter-Contract Communication

The Processor contract securely queries and communicates directly with the Registry contract on-chain to validate recipient registration and operational permissions before executing any tip transfer.

### 3. Event Streaming & Real-Time Updates

Both contracts emit custom Soroban system events during critical state changes (e.g., tip sent, registry updated). The JavaScript frontend listens to these event streams to deliver live, real-time UI updates without requiring manual page refreshes.

### 4. Error Handling & Loading States

* Smart Contracts: Robust custom error enums in Rust handling edge cases such as uninitialized accounts, invalid amounts, and cross-call authorization failures.
* Frontend: Clear transaction loading states, success/error feedback loops, and wallet signature notifications.

## Testing & Quality Assurance

Comprehensive unit and integration test suites are written to validate both the smart contracts and the application logic.

### Expected Test Output (3+ Passing Tests)

```bash
running 3 tests
test test_initialize_registry ... ok
test test_cross_contract_communication ... ok
test test_process_tip_execution ... ok
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out;

```

### Running Tests Locally

```bash
cargo test

```

## Production Infrastructure & CI/CD Pipeline

The project features a fully automated workflow leveraging GitHub Actions for continuous integration and continuous deployment (CI/CD):

1. Automated Checks: Compiles Rust code, targets WebAssembly, and executes cargo test on every push/PR.
2. Build Stage: Validates JavaScript/CSS dependencies and production builds.
3. Continuous Deployment: Automatically triggers a deployment sync to Railway upon successful builds on the main branch.

## Mobile Responsive Frontend

Built using modern JavaScript, HTML, and responsive CSS practices:

* Fully optimized for desktop, tablet, and mobile device viewports.
* Seamless wallet integration for signing Stellar/Soroban transactions.

## Getting Started & Local Development

### Prerequisites

* Rust toolchain with target wasm32-unknown-unknown
* Soroban CLI
* Node.js & npm / yarn

### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/banzaan/stellar-tip-bot.git
cd stellar-tip-bot

```

2. Install Frontend Dependencies:

```bash
npm install

```

3. Build Smart Contracts:

```bash
cargo build --target wasm32-unknown-unknown --release

```

4. Run the Application Locally:

```bash
npm run start

```

## Proof & Visual Documentation

### Mobile & desktop Responsive UI Screenshot

![Mobile UI 1](https://raw.githubusercontent.com/banzaan/stellar-tip-bot/main/assets/photo_5978671489550585198_y.jpg)

![desktop UI 3](https://raw.githubusercontent.com/banzaan/stellar-tip-bot/main/assets/photo_5978671489550585201_y.jpg)

![Multi wallet UI 4](https://raw.githubusercontent.com/banzaan/stellar-tip-bot/main/assets/photo_5978671489550585202_y.jpg)



### CI/CD Pipeline Running Screenshot

> ![ green checkmarks on GitHub Actions workflow](https://github.com/banzaan/stellar-tip-bot/blob/main/assets/IMG_20260721_143330.png)

### Test Output Screenshot (3+ Passing Tests)

> ![test output](https://raw.githubusercontent.com/banzaan/stellar-tip-bot/main/assets/photo_5978671489550585199_y.jpg)
> ![test output](https://raw.githubusercontent.com/banzaan/stellar-tip-bot/main/assets/photo_5978671489550585203_y.jpg)
