class AddSignatureToMessages < ActiveRecord::Migration
  def change
    add_column :messages, :signature, :text
  end
end
