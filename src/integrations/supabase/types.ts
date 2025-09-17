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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          success: boolean
          target_table: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          success?: boolean
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          success?: boolean
          target_table?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ambassadors: {
        Row: {
          active: boolean | null
          asaas_split_config: Json | null
          commission_rate: number | null
          created_at: string | null
          id: string
          link_clicks: number | null
          referral_code: string
          total_earnings: number | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          asaas_split_config?: Json | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          link_clicks?: number | null
          referral_code: string
          total_earnings?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          asaas_split_config?: Json | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          link_clicks?: number | null
          referral_code?: string
          total_earnings?: number | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ambassadors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_post_tags: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "blog_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_keywords: string[] | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_keywords?: string[] | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      business_analytics: {
        Row: {
          business_id: string
          clicks_count: number
          contacts_count: number
          created_at: string
          date: string
          id: string
          map_clicks: number
          reviews_count: number
          search_appearances: number
          views_count: number
        }
        Insert: {
          business_id: string
          clicks_count?: number
          contacts_count?: number
          created_at?: string
          date: string
          id?: string
          map_clicks?: number
          reviews_count?: number
          search_appearances?: number
          views_count?: number
        }
        Update: {
          business_id?: string
          clicks_count?: number
          contacts_count?: number
          created_at?: string
          date?: string
          id?: string
          map_clicks?: number
          reviews_count?: number
          search_appearances?: number
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_analytics_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_boosts: {
        Row: {
          active: boolean
          boost_type: string
          business_id: string
          cost_credits: number
          created_at: string
          expires_at: string
          id: string
          starts_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          boost_type: string
          business_id: string
          cost_credits?: number
          created_at?: string
          expires_at: string
          id?: string
          starts_at?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          boost_type?: string
          business_id?: string
          cost_credits?: number
          created_at?: string
          expires_at?: string
          id?: string
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_boosts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_credits: {
        Row: {
          business_id: string
          created_at: string
          credits_balance: number
          credits_earned: number
          credits_spent: number
          id: string
          last_updated: string
        }
        Insert: {
          business_id: string
          created_at?: string
          credits_balance?: number
          credits_earned?: number
          credits_spent?: number
          id?: string
          last_updated?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          credits_balance?: number
          credits_earned?: number
          credits_spent?: number
          id?: string
          last_updated?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_credits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_message_replies: {
        Row: {
          created_at: string
          id: string
          is_business_owner: boolean
          message_id: string
          reply_text: string
          sender_email: string
          sender_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_business_owner?: boolean
          message_id: string
          reply_text: string
          sender_email: string
          sender_name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_business_owner?: boolean
          message_id?: string
          reply_text?: string
          sender_email?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_message_replies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "business_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      business_messages: {
        Row: {
          business_id: string
          created_at: string
          id: string
          message: string
          sender_email: string
          sender_name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          message: string
          sender_email: string
          sender_name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_email?: string
          sender_name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          comment: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          reviewer_email: string | null
          reviewer_id: string | null
          reviewer_name: string
          status: string
          title: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          business_id: string
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          reviewer_email?: string | null
          reviewer_id?: string | null
          reviewer_name: string
          status?: string
          title?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          business_id?: string
          comment?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          reviewer_email?: string | null
          reviewer_id?: string | null
          reviewer_name?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_service_areas: {
        Row: {
          active: boolean
          area_name: string
          area_type: string
          business_id: string
          city: string | null
          created_at: string
          id: string
          state: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          area_name: string
          area_type: string
          business_id: string
          city?: string | null
          created_at?: string
          id?: string
          state: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          area_name?: string
          area_type?: string
          business_id?: string
          city?: string | null
          created_at?: string
          id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_service_areas_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          auto_renew: boolean | null
          business_id: string | null
          created_at: string | null
          expires_at: string | null
          external_subscription_id: string | null
          id: string
          payment_provider: string | null
          plan_id: string
          starts_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          business_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_provider?: string | null
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          business_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_provider?: string | null
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          boost_score: number | null
          category: Database["public"]["Enums"]["business_category"]
          city: string | null
          clicks_count: number | null
          contacts_count: number | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          featured: boolean | null
          gallery_images: string[] | null
          grace_period_end: string | null
          id: string
          instagram: string | null
          last_payment_date: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          plan_features: Json | null
          postal_code: string | null
          premium_until: string | null
          requires_subscription: boolean | null
          slug: string
          state: string | null
          subcategory: string | null
          subscription_active: boolean | null
          subscription_expires_at: string | null
          subscription_plan: string | null
          subscription_renewal_date: string | null
          total_boost_credits: number | null
          updated_at: string | null
          views_count: number | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          boost_score?: number | null
          category: Database["public"]["Enums"]["business_category"]
          city?: string | null
          clicks_count?: number | null
          contacts_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          gallery_images?: string[] | null
          grace_period_end?: string | null
          id?: string
          instagram?: string | null
          last_payment_date?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          plan_features?: Json | null
          postal_code?: string | null
          premium_until?: string | null
          requires_subscription?: boolean | null
          slug: string
          state?: string | null
          subcategory?: string | null
          subscription_active?: boolean | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_renewal_date?: string | null
          total_boost_credits?: number | null
          updated_at?: string | null
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          boost_score?: number | null
          category?: Database["public"]["Enums"]["business_category"]
          city?: string | null
          clicks_count?: number | null
          contacts_count?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured?: boolean | null
          gallery_images?: string[] | null
          grace_period_end?: string | null
          id?: string
          instagram?: string | null
          last_payment_date?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          plan_features?: Json | null
          postal_code?: string | null
          premium_until?: string | null
          requires_subscription?: boolean | null
          slug?: string
          state?: string | null
          subcategory?: string | null
          subscription_active?: boolean | null
          subscription_expires_at?: string | null
          subscription_plan?: string | null
          subscription_renewal_date?: string | null
          total_boost_credits?: number | null
          updated_at?: string | null
          views_count?: number | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          member_count: number | null
          name: string
          private: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name: string
          private?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          member_count?: number | null
          name?: string
          private?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          instructor_id: string | null
          level: string | null
          price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          level?: string | null
          price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          instructor_id?: string | null
          level?: string | null
          price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mailrelay_sync_log: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string
          error_message: string | null
          id: string
          mailrelay_id: string | null
          operation: string
          operation_type: string
          processed_at: string | null
          request_data: Json | null
          response_data: Json | null
          status: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          error_message?: string | null
          id?: string
          mailrelay_id?: string | null
          operation: string
          operation_type: string
          processed_at?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          error_message?: string | null
          id?: string
          mailrelay_id?: string | null
          operation?: string
          operation_type?: string
          processed_at?: string | null
          request_data?: Json | null
          response_data?: Json | null
          status?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          active: boolean | null
          email: string
          id: string
          last_sync_error: string | null
          mailrelay_id: string | null
          name: string | null
          origin: string | null
          source: string | null
          subscribed_at: string | null
          synced_at: string | null
          user_type: string | null
        }
        Insert: {
          active?: boolean | null
          email: string
          id?: string
          last_sync_error?: string | null
          mailrelay_id?: string | null
          name?: string | null
          origin?: string | null
          source?: string | null
          subscribed_at?: string | null
          synced_at?: string | null
          user_type?: string | null
        }
        Update: {
          active?: boolean | null
          email?: string
          id?: string
          last_sync_error?: string | null
          mailrelay_id?: string | null
          name?: string | null
          origin?: string | null
          source?: string | null
          subscribed_at?: string | null
          synced_at?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      premium_features: {
        Row: {
          active: boolean
          created_at: string
          credits_cost: number | null
          description: string | null
          display_name: string
          feature_name: string
          id: string
          required_plan: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          credits_cost?: number | null
          description?: string | null
          display_name: string
          feature_name: string
          id?: string
          required_plan: string
        }
        Update: {
          active?: boolean
          created_at?: string
          credits_cost?: number | null
          description?: string | null
          display_name?: string
          feature_name?: string
          id?: string
          required_plan?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          commission_rate: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          digital: boolean | null
          gallery_images: string[] | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          digital?: boolean | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          commission_rate?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          digital?: boolean | null
          gallery_images?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          can_edit_blog: boolean | null
          city: string | null
          country: string | null
          cpf: string
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          newsletter_subscribed: boolean | null
          onboarding_completed: boolean | null
          phone: string | null
          roles: Database["public"]["Enums"]["user_role"][] | null
          state: string | null
          subscription_types:
            | Database["public"]["Enums"]["subscription_type"][]
            | null
          updated_at: string | null
          user_types: Database["public"]["Enums"]["user_type"][] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          can_edit_blog?: boolean | null
          city?: string | null
          country?: string | null
          cpf: string
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          newsletter_subscribed?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          roles?: Database["public"]["Enums"]["user_role"][] | null
          state?: string | null
          subscription_types?:
            | Database["public"]["Enums"]["subscription_type"][]
            | null
          updated_at?: string | null
          user_types?: Database["public"]["Enums"]["user_type"][] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          can_edit_blog?: boolean | null
          city?: string | null
          country?: string | null
          cpf?: string
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          newsletter_subscribed?: boolean | null
          onboarding_completed?: boolean | null
          phone?: string | null
          roles?: Database["public"]["Enums"]["user_role"][] | null
          state?: string | null
          subscription_types?:
            | Database["public"]["Enums"]["subscription_type"][]
            | null
          updated_at?: string | null
          user_types?: Database["public"]["Enums"]["user_type"][] | null
        }
        Relationships: []
      }
      site_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          limits: Json
          name: string
          price_6monthly: number | null
          price_monthly: number
          price_yearly: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          limits?: Json
          name: string
          price_6monthly?: number | null
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          limits?: Json
          name?: string
          price_6monthly?: number | null
          price_monthly?: number
          price_yearly?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_photo_url: string | null
          created_at: string
          google_review_id: string | null
          id: string
          rating: number
          review_text: string | null
          review_time: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          created_at?: string
          google_review_id?: string | null
          id?: string
          rating: number
          review_text?: string | null
          review_time: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          created_at?: string
          google_review_id?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          review_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          ambassador_id: string | null
          amount: number
          asaas_payment_id: string | null
          asaas_webhook_data: Json | null
          business_id: string | null
          commission_amount: number | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          id: string
          product_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
        }
        Insert: {
          ambassador_id?: string | null
          amount: number
          asaas_payment_id?: string | null
          asaas_webhook_data?: Json | null
          business_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Update: {
          ambassador_id?: string | null
          amount?: number
          asaas_payment_id?: string | null
          asaas_webhook_data?: Json | null
          business_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          id?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_type: string
          city: string
          complement: string | null
          country: string
          created_at: string
          id: string
          is_primary: boolean
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          postal_code: string | null
          state: string
          street: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_type: string
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          postal_code?: string | null
          state: string
          street: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_type?: string
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          postal_code?: string | null
          state?: string
          street?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string
          id: string
          is_primary: boolean
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          active: boolean | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission_name: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_name: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_cycle: string
          created_at: string | null
          expires_at: string | null
          external_subscription_id: string | null
          id: string
          payment_provider: string | null
          plan_id: string
          starts_at: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle?: string
          created_at?: string | null
          expires_at?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_provider?: string | null
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle?: string
          created_at?: string | null
          expires_at?: string | null
          external_subscription_id?: string | null
          id?: string
          payment_provider?: string | null
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events_log: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          payment_id: string | null
          processed_at: string
          subscription_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          payment_id?: string | null
          processed_at?: string
          subscription_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          payment_id?: string | null
          processed_at?: string
          subscription_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          user_uuid: string
        }
        Returns: undefined
      }
      calculate_business_rating: {
        Args: { business_uuid: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      calculate_business_rating_all: {
        Args: { business_uuid: string }
        Returns: {
          average_rating: number
          total_reviews: number
        }[]
      }
      calculate_business_rating_internal: {
        Args: { business_uuid: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      cleanup_old_activity_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_business_credits_account: {
        Args: { business_uuid: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          notification_action_url?: string
          notification_data?: Json
          notification_message: string
          notification_title: string
          notification_type: string
          target_user_id: string
        }
        Returns: string
      }
      deactivate_expired_businesses: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      evolve_newsletter_to_profile: {
        Args: {
          full_name?: string
          phone?: string
          user_cpf: string
          user_email: string
        }
        Returns: string
      }
      format_cpf: {
        Args: { cpf_input: string }
        Returns: string
      }
      generate_business_slug: {
        Args: { business_id: string; business_name: string }
        Returns: string
      }
      get_admin_business_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_rating: number
          business_category: string
          business_city: string
          business_id: string
          business_name: string
          business_state: string
          created_at: string
          owner_email: string
          subscription_active: boolean
          subscription_plan: string
          total_clicks: number
          total_contacts: number
          total_reviews: number
          total_views: number
        }[]
      }
      get_admin_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          active_subscriptions: number
          new_users_this_month: number
          total_businesses: number
          total_subscriptions: number
          total_users: number
        }[]
      }
      get_ambassador_by_referral: {
        Args: { referral_code: string }
        Returns: {
          asaas_split_config: Json
          commission_rate: number
          id: string
          user_id: string
        }[]
      }
      get_business_boosts: {
        Args: { business_uuid: string }
        Returns: {
          active: boolean
          boost_type: string
          expires_at: string
        }[]
      }
      get_business_contacts: {
        Args: { p_business_id: string }
        Returns: {
          address: string
          email: string
          instagram: string
          phone: string
          postal_code: string
          website: string
          whatsapp: string
        }[]
      }
      get_business_service_areas: {
        Args: { business_uuid: string }
        Returns: {
          active: boolean
          area_name: string
          area_type: string
          id: string
          state: string
        }[]
      }
      get_current_user_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_blog_edit_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_featured_businesses: {
        Args: { limit_count?: number }
        Returns: {
          average_rating: number
          category: string
          city: string
          cover_image_url: string
          description: string
          id: string
          logo_url: string
          name: string
          reviews_count: number
          slug: string
          state: string
          subscription_plan: string
          views_count: number
        }[]
      }
      get_google_places_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_pending_business_reviews: {
        Args: { business_uuid: string }
        Returns: {
          business_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          reviewer_email: string
          reviewer_name: string
          title: string
          verified: boolean
        }[]
      }
      get_popular_blog_tags: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          name: string
          post_count: number
          slug: string
        }[]
      }
      get_profiles_admin_safe: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          can_edit_blog: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          is_admin: boolean
          newsletter_subscribed: boolean
          roles: Database["public"]["Enums"]["user_role"][]
          subscription_types: Database["public"]["Enums"]["subscription_type"][]
        }[]
      }
      get_public_business_by_id: {
        Args: { p_business_id: string }
        Returns: {
          category: string
          city: string
          clicks_count: number
          contacts_count: number
          cover_image_url: string
          created_at: string
          description: string
          featured: boolean
          gallery_images: string[]
          id: string
          instagram: string
          latitude: number
          logo_url: string
          longitude: number
          name: string
          opening_hours: Json
          state: string
          subcategory: string
          views_count: number
          website: string
        }[]
      }
      get_public_business_by_slug: {
        Args: { p_slug: string }
        Returns: {
          category: string
          city: string
          clicks_count: number
          contacts_count: number
          cover_image_url: string
          created_at: string
          description: string
          featured: boolean
          gallery_images: string[]
          id: string
          instagram: string
          latitude: number
          logo_url: string
          longitude: number
          name: string
          opening_hours: Json
          state: string
          subcategory: string
          views_count: number
          website: string
        }[]
      }
      get_public_business_reviews: {
        Args: {
          business_uuid: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          business_id: string
          comment: string
          created_at: string
          helpful_count: number
          id: string
          rating: number
          reviewer_name: string
          title: string
          verified: boolean
        }[]
      }
      get_public_businesses: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_rating: number
          category: string
          city: string
          clicks_count: number
          cover_image_url: string
          created_at: string
          description: string
          featured: boolean
          id: string
          instagram: string
          latitude: number
          logo_url: string
          longitude: number
          name: string
          reviews_count: number
          slug: string
          state: string
          subcategory: string
          views_count: number
          website: string
        }[]
      }
      get_random_businesses: {
        Args: { limit_count?: number }
        Returns: {
          average_rating: number
          category: string
          city: string
          cover_image_url: string
          description: string
          id: string
          logo_url: string
          name: string
          reviews_count: number
          slug: string
          state: string
          subscription_plan: string
          views_count: number
        }[]
      }
      get_safe_business_reviews: {
        Args: { p_business_id: string; p_limit?: number; p_offset?: number }
        Returns: {
          business_id: string
          comment: string
          created_at: string
          helpful_count: number
          id: string
          rating: number
          reviewer_name: string
          title: string
          verified: boolean
        }[]
      }
      get_user_by_cpf: {
        Args: { cpf_input: string }
        Returns: {
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      increment_blog_post_views: {
        Args: { p_slug: string }
        Returns: boolean
      }
      is_user_author: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_valid_uuid: {
        Args: { uuid_string: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: {
          p_activity_type: string
          p_description: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: string
      }
      moderate_business_review: {
        Args: { new_status: string; review_uuid: string }
        Returns: Json
      }
      process_subscription_payment: {
        Args: {
          p_amount: number
          p_external_payment_id: string
          p_user_id: string
        }
        Returns: Json
      }
      publish_scheduled_posts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      remove_user_role: {
        Args: {
          old_role: Database["public"]["Enums"]["user_role"]
          user_uuid: string
        }
        Returns: undefined
      }
      renew_business_subscription: {
        Args: { business_uuid: string }
        Returns: boolean
      }
      secure_toggle_admin_status: {
        Args: { new_admin_status: boolean; target_user_id: string }
        Returns: boolean
      }
      secure_toggle_blog_editor: {
        Args: { new_editor_status: boolean; target_user_id: string }
        Returns: boolean
      }
      send_auth_email_via_mailrelay: {
        Args: { email_type: string; recipient_email: string; user_data?: Json }
        Returns: Json
      }
      setup_mailrelay_smtp: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      submit_business_review_safe: {
        Args: {
          p_business_id: string
          p_comment?: string
          p_rating: number
          p_reviewer_email?: string
          p_reviewer_id?: string
          p_reviewer_name: string
          p_title?: string
        }
        Returns: Json
      }
      track_referral_click: {
        Args: { referral_code: string }
        Returns: undefined
      }
      update_business_analytics: {
        Args: {
          business_uuid: string
          increment_by?: number
          metric_name: string
        }
        Returns: undefined
      }
      upsert_user_address_safe: {
        Args: {
          p_address_type: string
          p_city: string
          p_complement?: string
          p_country?: string
          p_is_primary?: boolean
          p_neighborhood?: string
          p_number?: string
          p_postal_code?: string
          p_state: string
          p_street: string
          p_user_id: string
        }
        Returns: Json
      }
      upsert_user_by_cpf: {
        Args: {
          cpf_input: string
          user_email?: string
          user_full_name?: string
          user_phone?: string
        }
        Returns: string
      }
      upsert_user_contact_safe: {
        Args: {
          p_contact_type: string
          p_contact_value: string
          p_is_primary?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      user_has_business: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_name: string; user_uuid: string }
        Returns: boolean
      }
      user_has_role: {
        Args: {
          role_name: Database["public"]["Enums"]["user_role"]
          user_uuid: string
        }
        Returns: boolean
      }
      validate_cpf: {
        Args: { cpf_input: string }
        Returns: boolean
      }
    }
    Enums: {
      business_category:
        | "alimentacao"
        | "beleza"
        | "educacao"
        | "saude"
        | "moda"
        | "casa_decoracao"
        | "tecnologia"
        | "servicos"
        | "artesanato"
        | "consultoria"
        | "eventos"
        | "marketing"
      post_status: "draft" | "published" | "archived"
      subscription_type:
        | "newsletter"
        | "community"
        | "business_basic"
        | "business_premium"
      transaction_status: "pending" | "completed" | "cancelled" | "refunded"
      transaction_type: "product" | "subscription" | "donation"
      user_role:
        | "admin"
        | "business_owner"
        | "ambassador"
        | "community_member"
        | "blog_editor"
        | "customer"
        | "author"
      user_type:
        | "admin"
        | "member"
        | "business_owner"
        | "ambassador"
        | "customer"
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
      business_category: [
        "alimentacao",
        "beleza",
        "educacao",
        "saude",
        "moda",
        "casa_decoracao",
        "tecnologia",
        "servicos",
        "artesanato",
        "consultoria",
        "eventos",
        "marketing",
      ],
      post_status: ["draft", "published", "archived"],
      subscription_type: [
        "newsletter",
        "community",
        "business_basic",
        "business_premium",
      ],
      transaction_status: ["pending", "completed", "cancelled", "refunded"],
      transaction_type: ["product", "subscription", "donation"],
      user_role: [
        "admin",
        "business_owner",
        "ambassador",
        "community_member",
        "blog_editor",
        "customer",
        "author",
      ],
      user_type: [
        "admin",
        "member",
        "business_owner",
        "ambassador",
        "customer",
      ],
    },
  },
} as const
