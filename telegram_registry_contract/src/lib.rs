#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String, Symbol, symbol_short};
const ADMIN_KEY: Symbol = symbol_short!("admin");

#[contract]
pub struct TelegramRegistryContract;

#[contractimpl]
impl TelegramRegistryContract {
    

    pub fn init(env: Env, bot_address: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("Contract already initialized!");
        }
        env.storage().instance().set(&ADMIN_KEY, &bot_address);
    }


    pub fn link_address(env: Env, bot_operator: Address, telegram_username: String, user_address: Address) {
        user_address.require_auth();


        let registered_bot: Address = env.storage().instance().get(&ADMIN_KEY).unwrap_or_else(|| panic!("Not initialized"));
        if bot_operator != registered_bot {
            panic!("Unauthorized: Bot signature is missing or invalid!");
        }

        

        env.storage().persistent().set(&telegram_username, &user_address);
    }

    pub fn get_address(env: Env, telegram_username: String) -> Address {
        env.storage().persistent().get(&telegram_username).unwrap_or_else(|| panic!("User not found"))
    }
}