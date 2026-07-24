#![cfg(test)]
use super::*;
use soroban_sdk::{Env, Address, String};

#[test]
fn test_successful_registration() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TelegramRegistryContract, ());
    let client = TelegramRegistryContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let username = String::from_str(&env, "alice_stellar");

    client.link_address(&username, &user);

    let resolved_address = client.get_address(&username);
    assert_eq!(resolved_address, user);
}