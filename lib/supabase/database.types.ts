export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      board_outfits: {
        Row: {
          added_at: string
          board_id: string
          outfit_id: string
        }
        Insert: {
          added_at?: string
          board_id: string
          outfit_id: string
        }
        Update: {
          added_at?: string
          board_id?: string
          outfit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_outfits_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "board_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_outfits_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_outfits_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "board_outfits_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "board_outfits_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "board_outfits_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      boards: {
        Row: {
          cover_outfit_id: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_outfit_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_outfit_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_products: {
        Row: {
          brand_key: string
          brand_profile_id: string
          buy_url: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          brand_key: string
          brand_profile_id: string
          buy_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          brand_key?: string
          brand_profile_id?: string
          buy_url?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_products_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "brand_products_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "brand_products_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          body: string
          created_at: string
          id: string
          outfit_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          outfit_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          outfit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "comments_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "comments_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "comments_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          outfit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          outfit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          outfit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "likes_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "likes_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "likes_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          content_data: Json | null
          content_type: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          content_data?: Json | null
          content_type?: Database["public"]["Enums"]["message_content_type"]
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          content_data?: Json | null
          content_type?: Database["public"]["Enums"]["message_content_type"]
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          created_at: string
          id: string
          outfit_id: string | null
          read_at: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          outfit_id?: string | null
          read_at?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          outfit_id?: string | null
          read_at?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "notifications_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "notifications_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "notifications_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_save_counts: {
        Row: {
          count: number
          outfit_id: string
          updated_at: string
        }
        Insert: {
          count?: number
          outfit_id: string
          updated_at?: string
        }
        Update: {
          count?: number
          outfit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_save_counts_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: true
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "outfit_save_counts_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: true
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "outfit_save_counts_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: true
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "outfit_save_counts_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: true
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_views: {
        Row: {
          id: string
          outfit_id: string
          user_id: string | null
          viewed_at: string
          viewer_token: string
        }
        Insert: {
          id?: string
          outfit_id: string
          user_id?: string | null
          viewed_at?: string
          viewer_token: string
        }
        Update: {
          id?: string
          outfit_id?: string
          user_id?: string | null
          viewed_at?: string
          viewer_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_views_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "outfit_views_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "outfit_views_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "outfit_views_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "outfit_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "outfit_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          alt_text: string | null
          category: string | null
          code: string
          created_at: string
          created_by_admin: boolean
          deleted_at: string | null
          description: string | null
          gender: Database["public"]["Enums"]["outfit_gender"] | null
          id: string
          image_path: string
          image_url: string
          is_category_cover: boolean
          is_hidden: boolean
          is_published: boolean
          keywords: string[] | null
          meta_description: string | null
          scheduled_for: string | null
          slug: string | null
          title: string
          type: Database["public"]["Enums"]["outfit_type"]
          updated_at: string
          user_id: string
          vertical: string
        }
        Insert: {
          alt_text?: string | null
          category?: string | null
          code?: string
          created_at?: string
          created_by_admin?: boolean
          deleted_at?: string | null
          description?: string | null
          gender?: Database["public"]["Enums"]["outfit_gender"] | null
          id?: string
          image_path: string
          image_url: string
          is_category_cover?: boolean
          is_hidden?: boolean
          is_published?: boolean
          keywords?: string[] | null
          meta_description?: string | null
          scheduled_for?: string | null
          slug?: string | null
          title: string
          type?: Database["public"]["Enums"]["outfit_type"]
          updated_at?: string
          user_id: string
          vertical?: string
        }
        Update: {
          alt_text?: string | null
          category?: string | null
          code?: string
          created_at?: string
          created_by_admin?: boolean
          deleted_at?: string | null
          description?: string | null
          gender?: Database["public"]["Enums"]["outfit_gender"] | null
          id?: string
          image_path?: string
          image_url?: string
          is_category_cover?: boolean
          is_hidden?: boolean
          is_published?: boolean
          keywords?: string[] | null
          meta_description?: string | null
          scheduled_for?: string | null
          slug?: string | null
          title?: string
          type?: Database["public"]["Enums"]["outfit_type"]
          updated_at?: string
          user_id?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          avatar_url: string | null
          bio: string | null
          brand_name: string | null
          brand_website: string | null
          contact_email: string | null
          created_at: string
          display_name: string | null
          id: string
          instagram: string | null
          is_admin: boolean
          is_demo: boolean
          region: string
          tiktok: string | null
          updated_at: string
          username: string
          website: string | null
          youtube: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          brand_name?: string | null
          brand_website?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          instagram?: string | null
          is_admin?: boolean
          is_demo?: boolean
          region?: string
          tiktok?: string | null
          updated_at?: string
          username: string
          website?: string | null
          youtube?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          avatar_url?: string | null
          bio?: string | null
          brand_name?: string | null
          brand_website?: string | null
          contact_email?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          instagram?: string | null
          is_admin?: boolean
          is_demo?: boolean
          region?: string
          tiktok?: string | null
          updated_at?: string
          username?: string
          website?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          body: string | null
          created_at: string
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          status: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          status?: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          status?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          tagged_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tagged_item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tagged_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_tagged_item_id_fkey"
            columns: ["tagged_item_id"]
            isOneToOne: false
            referencedRelation: "tagged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string
          outfit_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          outfit_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          outfit_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "saves_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "saves_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "saves_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_clicks: {
        Row: {
          clicked_at: string
          id: string
          outfit_id: string
          referrer: string | null
          tag_id: string
          user_agent: string | null
          user_id: string | null
          viewer_token: string
          visitor_country: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          outfit_id: string
          referrer?: string | null
          tag_id: string
          user_agent?: string | null
          user_id?: string | null
          viewer_token: string
          visitor_country?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          outfit_id?: string
          referrer?: string | null
          tag_id?: string
          user_agent?: string | null
          user_id?: string | null
          viewer_token?: string
          visitor_country?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tag_clicks_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "tag_clicks_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "tag_clicks_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "tag_clicks_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_clicks_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tagged_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "tag_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tag_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tagged_items: {
        Row: {
          affiliate_network: string | null
          brand: string
          buy_url: string | null
          buy_urls: Json | null
          cached_metadata: Json | null
          color: string | null
          created_at: string
          currency: string | null
          alt_text: string | null
          description: string | null
          keywords: string[] | null
          material: string | null
          garment: string
          id: string
          image_url: string | null
          is_active: boolean
          is_affiliate: boolean
          last_fetched_at: string | null
          name: string
          outfit_id: string
          position_x: number
          position_y: number
          price: number | null
          retailer: string | null
          retailer_locale: string | null
        }
        Insert: {
          affiliate_network?: string | null
          brand: string
          buy_url?: string | null
          buy_urls?: Json | null
          cached_metadata?: Json | null
          color?: string | null
          created_at?: string
          currency?: string | null
          alt_text?: string | null
          description?: string | null
          keywords?: string[] | null
          material?: string | null
          garment: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_affiliate?: boolean
          last_fetched_at?: string | null
          name: string
          outfit_id: string
          position_x: number
          position_y: number
          price?: number | null
          retailer?: string | null
          retailer_locale?: string | null
        }
        Update: {
          affiliate_network?: string | null
          brand?: string
          buy_url?: string | null
          buy_urls?: Json | null
          cached_metadata?: Json | null
          color?: string | null
          created_at?: string
          currency?: string | null
          alt_text?: string | null
          description?: string | null
          keywords?: string[] | null
          material?: string | null
          garment?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_affiliate?: boolean
          last_fetched_at?: string | null
          name?: string
          outfit_id?: string
          position_x?: number
          position_y?: number
          price?: number | null
          retailer?: string | null
          retailer_locale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tagged_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "tagged_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "tagged_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "tagged_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      board_summary: {
        Row: {
          cover_outfit_id: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_public: boolean | null
          name: string | null
          outfit_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_engagement"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfit_stats"
            referencedColumns: ["outfit_id"]
          },
          {
            foreignKeyName: "boards_cover_outfit_id_fkey"
            columns: ["cover_outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "boards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_dashboard: {
        Row: {
          brand_clicks: number | null
          brand_key: string | null
          brand_profile_id: string | null
          comments: number | null
          created_at: string | null
          creator_id: string | null
          image_url: string | null
          likes: number | null
          outfit_id: string | null
          saves: number | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_engagement: {
        Row: {
          clicks: number | null
          comments: number | null
          created_at: string | null
          image_url: string | null
          likes: number | null
          outfit_id: string | null
          saves: number | null
          title: string | null
          unique_views: number | null
          user_id: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "brand_dashboard"
            referencedColumns: ["brand_profile_id"]
          },
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_stats: {
        Row: {
          comments: number | null
          likes: number | null
          outfit_id: string | null
          saves: number | null
        }
        Relationships: []
      }
      profile_stats: {
        Row: {
          followers: number | null
          following: number | null
          outfits: number | null
          profile_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      next_outfit_code: { Args: never; Returns: string }
    }
    Enums: {
      account_type: "creator" | "brand"
      message_content_type: "text" | "outfit_share" | "item_share"
      notification_type: "like" | "follow" | "comment"
      outfit_gender: "herr" | "dam"
      outfit_type: "photo" | "flatlay"
      report_reason:
        | "spam"
        | "harassment"
        | "inappropriate"
        | "misinformation"
        | "impersonation"
        | "copyright"
        | "other"
      report_target: "outfit" | "comment" | "profile"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["creator", "brand"],
      message_content_type: ["text", "outfit_share", "item_share"],
      notification_type: ["like", "follow", "comment"],
      outfit_gender: ["herr", "dam"],
      outfit_type: ["photo", "flatlay"],
      report_reason: [
        "spam",
        "harassment",
        "inappropriate",
        "misinformation",
        "impersonation",
        "copyright",
        "other",
      ],
      report_target: ["outfit", "comment", "profile"],
    },
  },
} as const
