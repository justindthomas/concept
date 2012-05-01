class AddEcdsaKeysToUsers < ActiveRecord::Migration
  def change
    add_column :users, :encrypted_signing_key, :text
    add_column :users, :verification_key, :text
  end
end
