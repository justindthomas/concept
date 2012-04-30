class AddEncryptedPrivateKeyToUsers < ActiveRecord::Migration
  def change
    add_column :users, :encrypted_private_key, :text
  end
end
