class MessageKey < ActiveRecord::Base
  belongs_to	:message
  belongs_to	:user
  alias_attribute	:recipient, :user

  def details
	{ :message => message, :sender => message.sender, :recipient => recipient }
  end
end
