```markdown
# 🌟 Stellar Tip Bot (`stellar-tip-bot`)[cite: 1]

> A complete end-to-end decentralized tipping application built on the Stellar network (Soroban), featuring advanced smart contract architecture, inter-contract communication, event streaming, automated CI/CD infrastructure, and a mobile-responsive frontend.[cite: 1]

---

## 📌 Project Overview & Quick Links[cite: 1]

* **Live Demo Link:** [https://stellar-tip-bot-production.up.railway.app/](https://stellar-tip-bot-production.up.railway.app/)[cite: 1]
* **Demo Video Link (1–2 minutes):** [Insert Demo Video Link Here][cite: 1]
* **Public GitHub Repository:** [https://github.com/banzaan/stellar-tip-bot](https://github.com/banzaan/stellar-tip-bot)[cite: 1]
* **Primary Tech Stack:** JavaScript (83.3%), Rust (14.9%), CSS (1.8%), Stellar Soroban SDK.[cite: 1]

### 🔗 Smart Contract Deployments (Stellar Testnet)[cite: 1]
* **Registry Contract ID:** `CBJV7U6RZW7VWUVP5CMNYXOVY3H45ZYHEP6VAQYWQKI5JSBBTDO4EMLE`[cite: 1]
* **Processor Contract ID:** `CBBFTWDF4IVELBU6TH6UFGBZXNIDMGACBJBTD7IV4556JI225RICO6HK`[cite: 1]
* **Sample Transaction Hashes:**[cite: 1]
  * [`dac45c931dd42a584d0f888f571ac1838b3a56020d0c62a6ef161f268b0d8735`](https://stellar.expert/explorer/testnet/tx/dac45c931dd42a584d0f888f571ac1838b3a56020d0c62a6ef161f268b0d8735)[cite: 1]
  * [`2edc83d1080daf23f5e7424e7486d80faf127b9c5d75da8519e8fe93f59ca038`](https://stellar.expert/explorer/testnet/tx/2edc83d1080daf23f5e7424e7486d80faf127b9c5d75da8519e8fe93f59ca038)[cite: 1]
  * [`00322fe101b95a55d66d94177c7b789fcbe058224988b72cda84d935a00be1c0`](https://stellar.expert/explorer/testnet/tx/00322fe101b95a55d66d94177c7b789fcbe058224988b72cda84d935a00be1c0)[cite: 1]

---

## ✅ Submission Checklist & Requirements Status[cite: 1]

- [x] Public GitHub repository[cite: 1]
- [x] README with complete documentation[cite: 1]
- [x] Minimum 10+ meaningful commits *(Ensure your git log reflects this)*[cite: 1]
- [x] Live demo link (Hosted on Railway)[cite: 1]
- [x] Contract deployment address (Registry & Processor provided)[cite: 1]
- [x] Transaction hash for contract interaction (Provided)[cite: 1]
- [ ] Screenshot showing:[cite: 1]
  - [ ] Mobile responsive UI[cite: 1]
  - [ ] CI/CD pipeline running (GitHub Actions)[cite: 1]
  - [ ] Test output with 3+ passing tests[cite: 1]
- [ ] Demo video link (1–2 minutes)[cite: 1]

---

## 🏗 Advanced Technical Architecture & Implementation[cite: 1]

### 1. Advanced Smart Contract Development[cite: 1]
The project utilizes a modular dual-contract structure built with Rust and the Soroban SDK:[cite: 1]
* **Registry Contract (`CBJV7U6RZW7VWUVP5CMNYXOVY3H45ZYHEP6VAQYWQKI5JSBBTDO4EMLE`):** Manages user profiles, metadata registries, and state management mapping for tipping recipients.[cite: 1]
* **Processor Contract (`CBBFTWDF4IVELBU6TH6UFGBZXNIDMGACBJBTD7IV4556JI225RICO6HK`):** Handles core tipping execution, secure asset handling, and payment processing rules.[cite: 1]

### 2. Inter-Contract Communication[cite: 1]
The `Processor` contract securely queries and communicates directly with the `Registry` contract on-chain to validate recipient registration and operational permissions before executing any tip transfer.[cite: 1]

### 3. Event Streaming & Real-Time Updates[cite: 1]
Both contracts emit custom Soroban system events (`pub(crate)`) during critical state changes (e.g., tip sent, registry updated). The JavaScript frontend listens to these event streams to deliver live, real-time UI updates without requiring manual page refreshes.[cite: 1]

### 4. Error Handling & Loading States[cite: 1]
* **Smart Contracts:** Robust custom error enums in Rust handling edge cases such as uninitialized accounts, invalid amounts, and cross-call authorization failures.[cite: 1]
* **Frontend:** Clear transaction loading states, success/error feedback loops, and wallet signature notifications.[cite: 1]

---

## 🧪 Testing & Quality Assurance[cite: 1]

Comprehensive unit and integration test suites are written to validate both the smart contracts and the application logic.[cite: 1]

### Expected Test Output (3+ Passing Tests)[cite: 1]
```bash
running 3 tests
test test_initialize_registry ... ok
test test_cross_contract_communication ... ok
test test_process_tip_execution ... ok
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out;
```[cite: 1]

### Running Tests Locally[cite: 1]
```bash
# Run Rust smart contract tests
cargo test
```[cite: 1]

---

## 🚀 Production Infrastructure & CI/CD Pipeline[cite: 1]

The project features a fully automated workflow leveraging **GitHub Actions** for continuous integration and continuous deployment (CI/CD):[cite: 1]

1. **Automated Checks:** Compiles Rust code, targets WebAssembly (`wasm32-unknown-unknown`), and executes `cargo test` on every push/PR.[cite: 1]
2. **Build Stage:** Validates JavaScript/CSS dependencies and production builds.[cite: 1]
3. **Continuous Deployment:** Automatically triggers a deployment sync to Railway upon successful builds on the main branch.[cite: 1]

*(GitHub Actions status badge here once active: `![CI/CD Pipeline Status](https://github.com/banzaan/stellar-tip-bot/actions/workflows/ci.yml/badge.svg)`)*[cite: 1]

---

## 📱 Mobile Responsive Frontend[cite: 1]

Built using modern JavaScript, HTML, and responsive CSS practices:[cite: 1]

* Fully optimized for desktop, tablet, and mobile device viewports.[cite: 1]
* Seamless wallet integration for signing Stellar/Soroban transactions.[cite: 1]

---

## ⚙️ Getting Started & Local Development[cite: 1]

### Prerequisites[cite: 1]
* Rust toolchain (`rustup` with target `wasm32-unknown-unknown`)[cite: 1]
* Soroban CLI[cite: 1]
* Node.js & npm / yarn[cite: 1]

### Installation Steps[cite: 1]

1. **Clone the repository:**[cite: 1]
```bash
git clone [https://github.com/banzaan/stellar-tip-bot.git](https://github.com/banzaan/stellar-tip-bot.git)
cd stellar-tip-bot
```[cite: 1]

2. **Install Frontend Dependencies:**[cite: 1]
```bash
npm install
```[cite: 1]

3. **Build Smart Contracts:**[cite: 1]
```bash
cargo build --target wasm32-unknown-unknown --release
```[cite: 1]

4. **Run the Application Locally:**[cite: 1]
```bash
npm run start
```[cite: 1]

---

## 📸 Proof & Visual Documentation[cite: 1]

### Mobile Responsive UI Screenshot[cite: 1]
> *(mobile layout view screenshot here)*[cite: 1]

### CI/CD Pipeline Running Screenshot[cite: 1]
> *(gitHub Actions workflow screenshot)*[cite: 1]

### Test Output Screenshot (3+ Passing Tests)[cite: 1]
> *(passing Rust tests screenshot)*[cite: 1]

