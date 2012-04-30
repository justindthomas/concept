class AddEncryptedKeyToMessageKeys < ActiveRecord::Migration
  def change
    add_column :message_keys, :encrypted_key, :string
  end
end
