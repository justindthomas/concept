class ChangeMessageKeyEncryptionKeyColumnType < ActiveRecord::Migration
  def up
    change_column :message_keys, :encrypted_key, :text
  end

  def down
  end
end
