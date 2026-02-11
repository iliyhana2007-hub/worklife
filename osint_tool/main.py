import os
import sys
import asyncio
import time
from telethon import TelegramClient, functions, types, errors
from dotenv import load_dotenv
from colorama import init, Fore, Style

# Initialize colors
init(autoreset=True)

# Load environment variables
load_dotenv()

# Configuration
API_ID = os.getenv('API_ID')
API_HASH = os.getenv('API_HASH')
SESSION_NAME = 'osint_session'

def print_banner():
    print(Fore.CYAN + """
    ╔════════════════════════════════════════════════════╗
    ║             TELEGRAM OSINT SCANNER                 ║
    ║        Search for user in specific groups          ║
    ╚════════════════════════════════════════════════════╝
    """)

def get_credentials():
    global API_ID, API_HASH
    if not API_ID or not API_HASH:
        print(Fore.YELLOW + "[!] API_ID and API_HASH not found in .env file.")
        print(Fore.WHITE + "You can get them from https://my.telegram.org/apps")
        API_ID = input(Fore.GREEN + "Enter API_ID: " + Fore.WHITE).strip()
        API_HASH = input(Fore.GREEN + "Enter API_HASH: " + Fore.WHITE).strip()

async def get_target_user(client, username):
    try:
        print(Fore.CYAN + f"[*] Resolving user: {username}...")
        user = await client.get_entity(username)
        
        # Display Basic Info
        print(Fore.GREEN + "\n[+] User Found!")
        print(f"    ID: {user.id}")
        print(f"    Username: @{user.username}" if user.username else "    Username: None")
        print(f"    First Name: {user.first_name}")
        print(f"    Last Name: {user.last_name}" if user.last_name else "    Last Name: None")
        
        if hasattr(user, 'phone') and user.phone:
             print(f"    Phone: {user.phone}")
        
        # Get Full Info for Bio
        full = await client(functions.users.GetFullUserRequest(user))
        print(f"    Bio: {full.full_user.about}" if full.full_user.about else "    Bio: None")
        
        return user
    except ValueError:
        print(Fore.RED + "[-] User not found.")
        return None
    except Exception as e:
        print(Fore.RED + f"[-] Error resolving user: {e}")
        return None

async def check_common_chats(client, user):
    print(Fore.CYAN + "\n[*] Checking for common chats (chats where BOTH you and target are present)...")
    try:
        common = await client(functions.messages.GetCommonChatsRequest(
            user_id=user.id,
            max_id=0,
            limit=100
        ))
        
        if not common.chats:
            print(Fore.YELLOW + "    No common chats found.")
        else:
            print(Fore.GREEN + f"[+] Found {len(common.chats)} common chats:")
            for chat in common.chats:
                print(f"    - {chat.title} (ID: {chat.id}) (@{chat.username if chat.username else 'private'})")
                
    except Exception as e:
        print(Fore.RED + f"[-] Error checking common chats: {e}")

async def scan_target_groups(client, target_user, delay=1.5):
    print(Fore.CYAN + "\n[*] Starting Global Scan in listed groups...")
    
    # Read chat list
    try:
        with open('target_chats.txt', 'r') as f:
            chats = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    except FileNotFoundError:
        print(Fore.RED + "[-] target_chats.txt not found! Please create it with a list of @usernames.")
        return

    print(Fore.WHITE + f"[*] Loaded {len(chats)} groups to scan.")
    found_count = 0

    for chat_username in chats:
        try:
            # Resolve chat
            try:
                chat = await client.get_entity(chat_username)
            except Exception:
                print(Fore.RED + f"    [x] Could not find chat: {chat_username}")
                continue

            # Check permissions/access
            if not isinstance(chat, (types.Channel, types.Chat)):
                print(Fore.YELLOW + f"    [!] {chat_username} is not a group/channel.")
                continue

            # Try to find user in participants
            # Using 'search' param is much faster and safer than fetching all members
            print(Fore.WHITE + f"    [?] Scanning {chat.title} ({chat_username})...", end='\r')
            
            participants = await client(functions.channels.GetParticipantsRequest(
                channel=chat,
                filter=types.ChannelParticipantsSearch(target_user.username or ""),
                offset=0,
                limit=10,
                hash=0
            ))
            
            # Check if our target ID is in the results
            is_member = False
            for p in participants.users:
                if p.id == target_user.id:
                    is_member = True
                    break
            
            if is_member:
                print(Fore.GREEN + f"    [+] FOUND in: {chat.title} (@{chat.username})          ")
                found_count += 1
            else:
                # Clear line if not found to keep output clean, or just pass
                pass
                # print(Fore.RESET + f"    [-] Not found in {chat.title}")

        except errors.FloodWaitError as e:
            print(Fore.RED + f"\n    [!] FloodWait: Sleeping for {e.seconds} seconds...")
            await asyncio.sleep(e.seconds)
        except errors.ChatAdminRequiredError:
             print(Fore.YELLOW + f"    [!] Admin rights required for {chat_username}")
        except Exception as e:
            # print(Fore.RED + f"    [-] Error scanning {chat_username}: {e}")
            pass
        
        # Rate limiting
        await asyncio.sleep(delay)

    print(Fore.CYAN + f"\n[=] Scan complete. Found user in {found_count} groups.")

async def main():
    print_banner()
    get_credentials()
    
    client = TelegramClient(SESSION_NAME, API_ID, API_HASH)
    
    print(Fore.CYAN + "[*] Connecting to Telegram...")
    await client.start()
    
    # Get own info
    me = await client.get_me()
    print(Fore.GREEN + f"[+] Connected as: {me.first_name} (@{me.username})")
    
    # Input Loop
    while True:
        target_input = input(Fore.YELLOW + "\nEnter target username (or 'q' to quit): " + Fore.WHITE).strip()
        if target_input.lower() == 'q':
            break
            
        if not target_input:
            continue
            
        target = await get_target_user(client, target_input)
        if target:
            await check_common_chats(client, target)
            
            do_scan = input(Fore.WHITE + "Run scanner on target_chats.txt list? (y/n): ").lower()
            if do_scan == 'y':
                await scan_target_groups(client, target)

    await client.disconnect()

if __name__ == '__main__':
    asyncio.run(main())
