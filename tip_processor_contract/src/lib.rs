#![no_std]
use soroban_sdk::{contract, contractimpl, token, Address, Env, String, Symbol};

mod registry {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/telegram_registry_contract.wasm"
    );
}

#[contract]
pub struct TipProcessorContract;

#[contractimpl]
impl TipProcessorContract {
    pub fn process_tip(
        env: Env,
        registry_address: Address,
        token_address: Address,
        bot_operator: Address,
        fee_receiver: Address, 
        from_username: String,
        to_username: String,
        amount: i128,
    ) {

        bot_operator.require_auth();


        let registry_client = registry::Client::new(&env, &registry_address);
        let from_address = registry_client.get_address(&from_username);
        let to_address = registry_client.get_address(&to_username);
        
        let token_client = token::Client::new(&env, &token_address);

        let fee_amount = amount / 100;
        
        let net_amount = amount - fee_amount;


        if fee_amount > 0 {
            token_client.transfer(&from_address, &fee_receiver, &fee_amount);
        }


        token_client.transfer(&from_address, &to_address, &net_amount);


        env.events().publish(
            (Symbol::new(&env, "tip_success"), from_username),
            (to_username, amount, fee_amount),
        );
    }
}
mod test;