class ChangeKeyType < ActiveRecord::Migration
  def up
    change_table :users do |t|
      t.change :public_key, :text
    end
  end

  def down
  end
end
