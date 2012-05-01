class MessagesController < ApplicationController
  # GET /messages
  # GET /messages.json
  def index
    @messages = Message.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @messages, :include => [:user] }
    end
  end

  # GET /messages/1
  # GET /messages/1.json
  def show
    @message = Message.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @message, :include => [:user] }
      format.js { }
    end
  end

  # GET /messages/new
  # GET /messages/new.json
  def new
    @message = Message.new
    @recipient = User.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @message }
      format.js { }
    end
  end

  # GET /messages/1/edit
  def edit
    @message = Message.find(params[:id])
  end

  # POST /messages
  # POST /messages.json
  def create
    @message = Message.new(params[:message])
    @sender = User.find(:first, :conditions => [ "uuid = ?", params[:sender_uuid]])
    @message.user_id = @sender.id
    @message.save

    @recipient = User.find(:first, :conditions => [ "uuid = ?", params[:recipient_uuid]])

    @message_key = MessageKey.new
    @message_key.message_id = @message.id;
    @message_key.user_id = @recipient.id
    @message_key.encrypted_key = params[:symmetric_key_tag]
    @message_key.save

    respond_to do |format|
      if @message.save
        format.html { redirect_to @message, notice: 'Message was successfully created.' }
        format.json { render json: @message, status: :created, location: @message }
        format.js { }
      else
        format.html { render action: "new" }
        format.json { render json: @message.errors, status: :unprocessable_entity }
        format.js { }
      end
    end
  end

  # PUT /messages/1
  # PUT /messages/1.json
  def update
    @message = Message.find(params[:id])

    respond_to do |format|
      if @message.update_attributes(params[:message])
        format.html { redirect_to @message, notice: 'Message was successfully updated.' }
        format.json { head :ok }
      else
        format.html { render action: "edit" }
        format.json { render json: @message.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /messages/1
  # DELETE /messages/1.json
  def destroy
    @message = Message.find(params[:id])
    @message.destroy

    respond_to do |format|
      format.html { redirect_to messages_url }
      format.json { head :ok }
    end
  end
end
