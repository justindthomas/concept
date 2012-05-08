# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20120430183940) do

  create_table "message_keys", :force => true do |t|
    t.integer  "message_id"
    t.integer  "user_id"
    t.datetime "created_at",    :null => false
    t.datetime "updated_at",    :null => false
    t.text     "encrypted_key"
  end

  create_table "messages", :force => true do |t|
    t.text     "body"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.text     "signature"
    t.integer  "user_id"
  end

  create_table "users", :force => true do |t|
    t.string   "uuid"
    t.text     "public_key"
    t.datetime "created_at",            :null => false
    t.datetime "updated_at",            :null => false
    t.text     "encrypted_private_key"
    t.text     "encrypted_signing_key"
    t.text     "verification_key"
  end

end
