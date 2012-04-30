class CreateMessageKeys < ActiveRecord::Migration
  def change
    create_table :message_keys do |t|
      t.integer :message_id
      t.integer :user_id

      t.timestamps
    end
  end
end
