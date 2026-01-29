// components/RecipeRatingNotes.tsx
// Rating stars and notes section for recipe detail

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import { colors } from "../theme/colors";
import { RecipeNote } from "../models/Recipe";
import {
  fetchRecipeNotes,
  addRecipeNote,
  deleteRecipeNote,
  updateRecipeRating,
} from "../lib/recipeNotesService";

interface RecipeRatingNotesProps {
  recipeId: string;
  currentRating?: number;
  onRatingChange?: (rating: number) => void;
}

export function RecipeRatingNotes({
  recipeId,
  currentRating,
  onRatingChange,
}: RecipeRatingNotesProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [notes, setNotes] = useState<RecipeNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  // Fetch notes for this recipe
  const loadNotes = useCallback(async () => {
    try {
      const data = await fetchRecipeNotes(recipeId);
      setNotes(data || []);
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    setRating(currentRating || 0);
  }, [currentRating]);

  // Update rating
  const handleRatingPress = async (newRating: number) => {
    // Toggle off if same rating clicked
    const finalRating = rating === newRating ? 0 : newRating;
    setRating(finalRating);

    try {
      await updateRecipeRating(recipeId, finalRating || null);
      onRatingChange?.(finalRating);
    } catch (err) {
      console.error("Error updating rating:", err);
      setRating(currentRating || 0); // Revert on error
    }
  };

  // Add a new note
  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSaving(true);
    try {
      const data = await addRecipeNote(recipeId, newNote.trim());

      setNotes((prev) => [data, ...prev]);
      setNewNote("");
      setShowNoteInput(false);
    } catch (err) {
      console.error("Error adding note:", err);
      Alert.alert("Error", "Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a note
  const handleDeleteNote = (noteId: string) => {
    Alert.alert("Delete Note", "Are you sure you want to delete this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRecipeNote(recipeId, noteId);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
          } catch (err) {
            console.error("Error deleting note:", err);
            Alert.alert("Error", "Failed to delete note");
          }
        },
      },
    ]);
  };

  // Render star rating
  const renderStars = () => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => handleRatingPress(star)}
          style={styles.starButton}
        >
          <MaterialCommunityIcons
            name={star <= rating ? "star" : "star-outline"}
            size={32}
            color={star <= rating ? colors.warning : colors.textSecondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render a single note
  const renderNote = ({ item }: { item: RecipeNote }) => (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteDateContainer}>
          <MaterialCommunityIcons
            name="calendar"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.noteDate}>
            {item.cookedAt
              ? new Date(item.cookedAt).toLocaleDateString()
              : new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color={colors.error}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.noteText}>{item.note}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Rating Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Rating</Text>
        {renderStars()}
        {rating > 0 && (
          <Text style={styles.ratingText}>
            {rating === 5
              ? "Amazing!"
              : rating === 4
                ? "Great"
                : rating === 3
                  ? "Good"
                  : rating === 2
                    ? "Okay"
                    : "Not for me"}
          </Text>
        )}
      </View>

      {/* Notes Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Cooking Notes</Text>
          {!showNoteInput && (
            <TouchableOpacity
              onPress={() => setShowNoteInput(true)}
              style={styles.addButton}
            >
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.addButtonText}>Add Note</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Note Input */}
        {showNoteInput && (
          <View style={styles.noteInputContainer}>
            <TextInput
              style={styles.noteInput}
              placeholder="How did it turn out? Any modifications?"
              placeholderTextColor={colors.textSecondary}
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={3}
            />
            <View style={styles.noteInputActions}>
              <Button
                mode="text"
                onPress={() => {
                  setShowNoteInput(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleAddNote}
                loading={isSaving}
                disabled={isSaving || !newNote.trim()}
              >
                Save Note
              </Button>
            </View>
          </View>
        )}

        {/* Notes List */}
        {isLoading ? (
          <ActivityIndicator
            size="small"
            color={colors.primary}
            style={styles.loader}
          />
        ) : notes.length > 0 ? (
          <FlashList
            data={notes}
            renderItem={renderNote}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        ) : (
          !showNoteInput && (
            <Text style={styles.emptyText}>
              No notes yet. Add notes after cooking to remember what worked!
            </Text>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: "500",
  },
  noteInputContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noteInput: {
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: "top",
  },
  noteInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noteDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  noteDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  noteText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },
  loader: {
    marginVertical: 20,
  },
});

export default RecipeRatingNotes;
