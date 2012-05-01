class UsersController < ApplicationController

  def messages
    @user = User.find(:first, :conditions => [ "uuid = ?", params[:uuid]])
    @messages = @user.messages

    respond_to do |format|
      format.json { render json: @messages, :include => [:user] }
    end
  end

  def message_keys
    @user = User.find(:first, :conditions => [ "uuid = ?", params[:uuid]])
    @message_keys = @user.message_keys

    respond_to do |format|
      format.json { render json: @message_keys }
    end
  end

  # GET /users
  # GET /users.json
  def index
    @users = User.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @users }
    end
  end

  # GET /users/uuid
  # GET /users/uuid.json
  def show
    @user = User.find(:first, :conditions => [ "uuid = ?", params[:uuid]])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @user }
    end
  end

  # GET /users/new
  # GET /users/new.json
  def new
    @user = User.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @user }
    end
  end

  # GET /users/1/edit
  def edit
    @user = User.find(:first, :conditions => [ "uuid = ?", params[:uuid]])
  end

  # POST /users
  # POST /users.json
  def create
    @user = User.new(params[:user])
    @user.uuid = UUIDTools::UUID.random_create.to_s

    respond_to do |format|
      if @user.save
        format.html { redirect_to @users, notice: 'User was successfully created.' }
        format.json { render json: @users, status: :created, location: @user }
	format.js { }
      else
        format.html { render action: "new" }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /users/1
  # PUT /users/1.json
  def update
    @user = User.find(params[:id])

    respond_to do |format|
      if @user.update_attributes(params[:user])
        format.html { redirect_to @user, notice: 'User was successfully updated.' }
        format.json { head :ok }
      else
        format.html { render action: "edit" }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /users/1
  # DELETE /users/1.json
  def destroy
    @user = User.find(:first, :conditions => [ "uuid = ?", params[:uuid]])
    @user.destroy

    respond_to do |format|
      format.html { redirect_to users_url }
      format.json { head :ok }
    end
  end
end
