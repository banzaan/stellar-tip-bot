#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, String};
use soroban_sdk::testutils::Address as _;


mod registry_contract {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/telegram_registry_contract.wasm"
    );
}

#[test]
fn test_tip_processing() {
    let env = Env::default();
    env.mock_all_auths();


    let processor_id = env.register(TipProcessorContract, ());
    let _processor_client = TipProcessorContractClient::new(&env, &processor_id);


    let registry_id = env.register_contract_wasm(None, registry_contract::WASM);
    let registry_client = registry_contract::Client::new(&env, &registry_id);

    let _bot_operator = Address::generate(&env);
    let from_user = Address::generate(&env);
    let to_user = Address::generate(&env);

    let from_username = String::from_str(&env, "sender_tg");
    let to_username = String::from_str(&env, "receiver_tg");

    registry_client.link_address(&from_username, &from_user);
    registry_client.link_address(&to_username, &to_user);
}